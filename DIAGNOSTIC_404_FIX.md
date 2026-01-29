# 🚀 Quick Diagnostic - Why You're Getting 404

## Step 1: Verify Backend is Actually Running

### Check Terminal Tab "uvicorn"
Look at the "uvicorn" terminal tab in VS Code. You should see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 [CTRL+C to quit]
INFO:     Started server process [12345]
```

**If you see this** → Backend is running ✅

**If you see errors or it's not running** → Start it:
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Step 2: Test Backend Directly

### In Browser Console (F12)
```javascript
// Test if backend is accessible
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend is working:', d))
  .catch(e => console.error('❌ Backend error:', e))
```

**Expected output:**
```
✅ Backend is working: {status: 'healthy', version: '2.0.0', environment: 'development'}
```

**If you get error:**
- Backend is not running
- Or CORS is blocked
- Or running on wrong port

---

## Step 3: Test Signup Endpoint Directly

### In Browser Console (F12)
```javascript
// Test signup endpoint
fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'direct-test@example.com',
    password: 'TestPass123!',
    full_name: 'Direct Test'
  })
})
  .then(r => r.json())
  .then(d => console.log('✅ Signup works:', d))
  .catch(e => console.error('❌ Signup error:', e))
```

**Expected output:**
```
✅ Signup works: {access_token: 'eyJ...', token_type: 'bearer', user: {...}}
```

**If you get 404:**
- Go to backend and check main.py has: `from app.routers import auth_router`
- Check auth_router is imported in main.py
- Check auth.py exists in backend/app/routers/

**If you get CORS error (headers not allowed):**
- Go to backend/app/main.py
- Make sure CORSMiddleware is added and allows localhost:3000

---

## Step 4: Check Your Code Files

### Backend Config
**File:** `backend/app/main.py`

Should have around line 90:
```python
from app.routers import auth_router
app.include_router(auth_router)
```

✅ **If you see this** → Backend routing is correct

❌ **If missing** → Add these lines

---

### Frontend Signup
**File:** `app/signup/page.tsx`

Should have around line 74:
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

✅ **If you see this** → Frontend signup is correct

---

## Step 5: Common Issues

### ❌ Issue: "Cannot GET /auth/register"
**Cause:** Backend received request but route doesn't exist

**Fix:**
1. Check `backend/app/main.py` line 90-92
2. Verify `auth_router` is imported and included
3. Restart backend with Ctrl+C and run again

### ❌ Issue: "CORS error" 
**Cause:** Browser blocking request from different origin

**Fix:**
1. Check `backend/app/main.py` has CORSMiddleware
2. Make sure `allow_origins` includes `"http://localhost:3000"`
3. Restart backend

### ❌ Issue: "TypeError: Failed to fetch"
**Cause:** Backend might not be running

**Fix:**
1. Check uvicorn terminal tab
2. Make sure you see "Uvicorn running on http://0.0.0.0:8000"
3. If not, start it with the command above

### ❌ Issue: Signup submits but form doesn't change
**Cause:** Response parsing error or redirect not working

**Fix:**
1. Check browser console (F12) for errors
2. Check that router.push() is being called in signup/page.tsx
3. Look at Network tab to see actual response from backend

---

## Step 6: Test Everything End-to-End

### Test 1: Can I reach the backend?
```bash
# In PowerShell or terminal
curl http://localhost:8000/health
# Should return: {"status":"healthy",...}
```

### Test 2: Can I access the docs?
```bash
# Visit in browser
http://localhost:8000/docs
# Should show all endpoints including /auth/register
```

### Test 3: Can I signup from the form?
1. Go to http://localhost:3000/signup
2. Fill form with valid password (12+ chars)
3. Click Sign Up
4. Watch Network tab (F12 → Network) for requests
5. Look for POST to /auth/register

### Test 4: Is token saved?
1. After signup, open DevTools (F12)
2. Go to Application → Local Storage
3. Look for `token` key
4. Should have a long JWT value starting with `eyJ`

### Test 5: Does persistence work?
1. Refresh page (Ctrl+R)
2. Should stay on /dashboard (not redirect to /login)
3. Token should still be in localStorage

---

## 🔍 Debug Checklist

- [ ] Backend terminal shows "Uvicorn running on http://0.0.0.0:8000"
- [ ] Frontend terminal shows "Local: http://localhost:3000"
- [ ] http://localhost:8000/docs loads and shows endpoints
- [ ] http://localhost:8000/health returns {"status":"healthy"}
- [ ] http://localhost:3000/signup loads without errors
- [ ] browser console test: fetch('/health') returns data
- [ ] browser console test: fetch('/auth/register') works
- [ ] Signup form doesn't show 404 when you submit
- [ ] After signup, token appears in localStorage
- [ ] After refresh, you're still logged in

---

## If It's STILL Not Working

### Nuclear Option: Complete Restart

**Terminal 1:**
```bash
cd backend
ctrl+c  # Stop any running processes
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2:**
```bash
cd frontend
ctrl+c  # Stop any running processes
npm install
npm run dev
```

---

## 📞 If You Still Need Help

**Check these files exist:**
- ✅ `backend/app/main.py` (imports auth_router)
- ✅ `backend/app/routers/__init__.py` (exports auth_router)
- ✅ `backend/app/routers/auth.py` (has @router.post endpoints)
- ✅ `app/signup/page.tsx` (calls http://localhost:8000/auth/register)
- ✅ `app/login/page.tsx` (calls http://localhost:8000/auth/token)
- ✅ `components/AuthProvider.tsx` (checks localStorage token)

**Check these imports exist:**
- ✅ `main.py` line ~90: `from app.routers import auth_router`
- ✅ `main.py` line ~92: `app.include_router(auth_router)`
- ✅ `signup/page.tsx` line ~7: `import { setToken } from '@/lib/auth'`
- ✅ `login/page.tsx` line ~6: `import { setToken } from '@/lib/auth'`

---

## ✅ Expected Final State

When working correctly:

1. **Browser**: http://localhost:3000/signup → Form loads
2. **Form**: Fill out → Click Sign Up → No 404 error
3. **Response**: 200 OK with token data
4. **Storage**: Token saved to localStorage
5. **Navigation**: Redirected to /dashboard
6. **Refresh**: Stay on /dashboard (session persists)
7. **Logout**: Token cleared, redirect to /login

**You've got this!** 🚀
