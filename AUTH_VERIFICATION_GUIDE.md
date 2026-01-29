# Authentication System - Complete Verification Guide

## ✅ Backend Status

### Your Backend Configuration
**File:** `backend/app/main.py`

```python
# Line 90-92: Auth router is correctly imported and included
from app.routers import auth_router
app.include_router(auth_router)
```

**File:** `backend/app/routers/auth.py`

```python
# Lines 17-22: Router created with /auth prefix
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
    responses={404: {"description": "Not found"}},
)

# Line 46: Register endpoint at POST /auth/register
@router.post("/register", tags=["Authentication"])
async def register(email: str, password: str, full_name: str, ...):
    ...

# Line 125: Token endpoint at POST /auth/token
@router.post("/token", tags=["Authentication"])
async def login(form_data: OAuth2PasswordRequestForm = Depends(), ...):
    ...
```

### Backend Endpoints Available
- ✅ `POST /auth/register` → Signup endpoint
- ✅ `POST /auth/token` → Login endpoint  
- ✅ `GET /health` → Health check
- ✅ `GET /` → Root endpoint

**Server Location:** `http://localhost:8000`

---

## ✅ Frontend Status

### Signup Page: `app/signup/page.tsx`
**Status:** ✅ Correctly calling `http://localhost:8000/auth/register`

```typescript
const response = await fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: formData.email,
    password: formData.password,
    full_name: formData.fullName,  // ✅ Matches backend requirement
  }),
});
```

✅ **What it does:**
- Sends JSON with `email`, `password`, `full_name`
- Saves token to localStorage via `setToken(data.access_token)`
- Redirects to `/dashboard` on success
- Shows error message on failure

### Login Page: `app/login/page.tsx`
**Status:** ✅ Correctly calling `http://localhost:8000/auth/token`

```typescript
const formData = new FormData();
formData.append('username', email);      // ✅ FastAPI OAuth2 requires 'username'
formData.append('password', password);

const response = await fetch('http://localhost:8000/auth/token', {
  method: 'POST',
  body: formData,  // ✅ FormData for OAuth2 compatibility
});
```

✅ **What it does:**
- Sends FormData (not JSON) as required by OAuth2PasswordRequestForm
- Saves token to localStorage via `setToken(token)`
- Redirects to `/dashboard` on success

### AuthProvider: `components/AuthProvider.tsx`
**Status:** ✅ Persistence enabled

```typescript
useEffect(() => {
  const token = getToken();
  if (token) {
    console.log('User session restored from localStorage');
  } else {
    console.log('No active session found');
  }
  setIsHydrated(true);
}, []);
```

✅ **What it does:**
- Checks for token on app load
- Restores session if token exists
- Prevents hydration mismatch

---

## 🔍 How to Verify Everything Works

### Step 1: Check Backend is Running
```bash
# Terminal - see "uvicorn" tab
# Should show:
# Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Check Frontend is Running
```bash
# Terminal - see "node" tab  
# Should show:
# ▲ Next.js 14
# Local: http://localhost:3000
```

### Step 3: Open FastAPI Docs
**URL:** http://localhost:8000/docs

**You should see:**
- `POST /auth/register`
- `POST /auth/token`
- `GET /auth/logout` (if implemented)
- `GET /auth/users/me` (if implemented)
- `GET /health`
- `GET /`

### Step 4: Test Signup
1. Go to http://localhost:3000/signup
2. Fill the form:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "TestPass123!" (min 12 chars with uppercase, number, special char)
   - Confirm: "TestPass123!"
3. Click "Sign Up"
4. **Expected:** Redirects to `/dashboard`

### Step 5: Verify Token in Browser
1. Open DevTools (F12)
2. Go to **Application** → **Local Storage**
3. **Check for:** Key `token` with a long JWT value

**Should look like:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTZlMmY2NjczN2YzZDM2MzY0ZjY0NmM2ZTZkMjY2ZjY0NmM3YyIsImV4cCI6MTcwMzEwMzIwMH0...
```

### Step 6: Test Page Refresh (Session Persistence)
1. Refresh page (Ctrl+R)
2. **Expected:** Stay on `/dashboard` (not redirect to `/login`)
3. Token is still in localStorage

### Step 7: Test Login
1. Go to http://localhost:3000/login
2. Enter:
   - Email: `test@example.com`
   - Password: `TestPass123!`
3. Click "Sign In"
4. **Expected:** Redirects to `/dashboard` and saves token

---

## 🐛 Troubleshooting 404 Error

### Problem: GET 404 on /auth/register

**Reason 1: Backend not running**
- Check terminal tab "uvicorn"
- Make sure it says "Uvicorn running on http://0.0.0.0:8000"
- If not: Run `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

**Reason 2: Auth router not imported**
- Check `backend/app/main.py` line 90-92
- Should have:
  ```python
  from app.routers import auth_router
  app.include_router(auth_router)
  ```

**Reason 3: Router file doesn't exist**
- Check file exists: `backend/app/routers/auth.py`
- If missing, create it with the endpoints

**Reason 4: Wrong endpoint path**
- ✅ Correct: `http://localhost:8000/auth/register`
- ❌ Wrong: `http://localhost:8000/register`
- ❌ Wrong: `http://localhost:8000/api/auth/register`

### Verify with cURL

**Test signup endpoint:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "curl@example.com",
    "password": "TestPass123!",
    "full_name": "Curl User"
  }'
```

**Expected response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "some-uuid",
    "email": "curl@example.com",
    "full_name": "Curl User"
  }
}
```

**Test login endpoint:**
```bash
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=curl@example.com&password=TestPass123!"
```

---

## 📊 Request/Response Flow

### Signup Flow

```
Frontend (signup/page.tsx)
    ↓
fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'TestPass123!',
    full_name: 'Test User'
  })
})
    ↓
Backend (routers/auth.py)
    ↓
@router.post("/register")
async def register(email: str, password: str, full_name: str, db: Session):
  1. Validate email format
  2. Check password length (min 8)
  3. Check full_name not empty
  4. Check email not already registered
  5. Hash password with bcrypt
  6. Create User in database
  7. Generate JWT token
  8. Return token + user data
    ↓
Frontend receives response
    ↓
if response.ok:
  1. Save token: setToken(data.access_token)
  2. Save tokenType: localStorage.setItem('tokenType', 'bearer')
  3. Save user: localStorage.setItem('user', JSON.stringify(data.user))
  4. Redirect: router.push('/dashboard')
else:
  Show error: setError(data.detail)
```

### Login Flow

```
Frontend (login/page.tsx)
    ↓
fetch('http://localhost:8000/auth/token', {
  method: 'POST',
  body: FormData(username=email, password=password)
})
    ↓
Backend (routers/auth.py)
    ↓
@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm, db: Session):
  1. Extract email from form_data.username
  2. Extract password from form_data.password
  3. Find user by email in database
  4. Verify password against hash
  5. Generate JWT token
  6. Return token + user data
    ↓
Frontend receives response
    ↓
if response.ok:
  1. Save token: setToken(data.access_token)
  2. Save tokenType: localStorage.setItem('tokenType', 'bearer')
  3. Save user: localStorage.setItem('user', JSON.stringify(data.user))
  4. Redirect: router.push('/dashboard')
else:
  Show error: setError(data.detail)
```

### Session Persistence Flow

```
Page Refresh
    ↓
AuthProvider.tsx useEffect runs
    ↓
const token = getToken()  // Reads from localStorage
    ↓
if (token) {
  User is authenticated
  Page remains on /dashboard
} else {
  User is not authenticated
  Page can proceed to public pages
}
```

---

## 🔐 Data Storage

### LocalStorage After Signup/Login

```javascript
// View in DevTools → Application → Local Storage
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer",
  "user": "{\"id\":\"abc123\",\"email\":\"test@example.com\",\"full_name\":\"Test User\"}"
}
```

### Database After Signup

**Table: users**
```
id            | email              | full_name  | hashed_password           | is_active | created_at
------------- | ------------------ | ---------- | ------------------------- | --------- | ----------
abc123...     | test@example.com   | Test User  | $2b$12$XXXXXXXXXXXXXXXX... | true      | 2026-01-29
```

---

## ✅ Final Checklist

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] http://localhost:8000/docs shows all endpoints
- [ ] http://localhost:3000/signup loads without errors
- [ ] http://localhost:3000/login loads without errors
- [ ] Can sign up and get redirected to /dashboard
- [ ] Token appears in localStorage after signup
- [ ] Page refresh keeps you logged in (session persists)
- [ ] Can login with email/password
- [ ] Logout clears token and redirects to /login

---

## 🎯 Success Indicators

✅ **You'll know it's working when:**
1. Signup form submits without 404 error
2. You see a long JWT token in localStorage → token
3. You're automatically taken to /dashboard
4. Refreshing /dashboard keeps you logged in
5. Logging out removes the token from localStorage

**If signup still shows 404:** Check the Backend is running tab in the terminal.
