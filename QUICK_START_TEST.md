# 🚀 Quick Start - Test It Now!

## 5 Minutes to Working Authentication

### Step 1: Verify Both Servers Are Running (30 seconds)

**Check Backend:**
- Look at "uvicorn" terminal tab
- Should show: `INFO: Uvicorn running on http://0.0.0.0:8000`
- If not: `cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

**Check Frontend:**
- Look at "node" terminal tab  
- Should show: `▲ Next.js 14... Local: http://localhost:3000`
- If not: `cd frontend && npm run dev`

### Step 2: Test Backend is Alive (30 seconds)

**In browser, visit:**
```
http://localhost:8000/docs
```

**You should see:**
- `POST /auth/register` endpoint ✅
- `POST /auth/token` endpoint ✅
- Other endpoints below

### Step 3: Go to Signup Page (1 minute)

**Visit:**
```
http://localhost:3000/signup
```

**Fill the form:**
- Full Name: `Test User`
- Email: `test@example.com`
- Password: `TestPass123!` (must have: 12+ chars, uppercase, number, special)
- Confirm Password: `TestPass123!`

**Click: Sign Up**

### Step 4: Watch What Happens (1 minute)

**Expected (Success):**
- ✅ No 404 error appears
- ✅ Form disappears
- ✅ Redirects to `/dashboard` page
- ✅ Page shows dashboard content

**If you see error:**
- Check error message shown on form
- Common: "Email already registered" → Use different email
- Other error → See troubleshooting below

### Step 5: Verify Token Was Saved (1 minute)

**Open DevTools:**
- Press `F12` on keyboard
- Go to **Application** tab
- Go to **Local Storage** on left
- Click on `http://localhost:3000`

**You should see:**
- Key: `token`
- Value: Long string starting with `eyJ` (this is the JWT token!)

### Step 6: Test Session Persistence (30 seconds)

**Refresh the page:**
- Press `Ctrl+R` or `Cmd+R`

**Expected:**
- ✅ Still on `/dashboard`
- ✅ Token still in localStorage
- ✅ Did NOT redirect to `/login`

**This means:** Session persists across page refreshes! 🎉

---

## If It Works! ✅

Congratulations! Your authentication system is working.

Next: Test the login page

1. Clear localStorage: `localStorage.clear()` in console
2. Refresh page (should be at `/login` now)
3. Go to `/login`
4. Enter email and password from your signup
5. Should redirect to `/dashboard`

---

## If It Doesn't Work ❌

### Problem: 404 Error on Signup

**Step 1: Check backend terminal**
- Look at uvicorn tab
- Does it say "Uvicorn running on http://0.0.0.0:8000"?
- If not, start backend

**Step 2: Check FastAPI docs**
- Visit http://localhost:8000/docs
- Do you see `/auth/register` endpoint?
- If not, backend route issue

**Step 3: Open browser console (F12)**
- Go to Network tab
- Submit signup form
- Look for POST request to `http://localhost:8000/auth/register`
- If URL is different, check `frontend/config/api.ts`

**Step 4: Check logs**
- Look at backend terminal
- Does it show POST `/auth/register` request?
- If not, frontend not calling endpoint

### Problem: Token Not Saving

**Debug:**
1. Open console (F12)
2. Type: `localStorage.getItem('token')`
3. If you get `null` → Token not saving
4. Check for JavaScript errors in console

**Solution:**
- Check signup code calls `setToken(data.access_token)`
- Check response has `access_token` field
- Check for errors in console

### Problem: Page Doesn't Redirect

**Debug:**
1. Check frontend console (F12)
2. Look for errors
3. Check network tab for response status

**Common causes:**
- Response is 404 or 500 (backend error)
- Token not received in response
- `router.push()` not being called

### Problem: CORS Error

**Error message:** `Access to XMLHttpRequest blocked by CORS`

**Fix:**
1. Check `backend/app/main.py` has CORSMiddleware
2. Make sure it allows `localhost:3000`
3. Restart backend

### Problem: Form Has 404 Text

Example: `Network error: Failed to fetch. Please check if the backend is running at http://localhost:8000/auth/register`

**This means:**
- Backend is not running
- Or wrong URL being called

**Fix:**
1. Start backend
2. Check `frontend/config/api.ts` has correct URL
3. Try again

---

## What Should Happen Step-by-Step

```
1. User visits /signup
   ↓
2. AuthProvider checks localStorage
   ↓
3. No token found → Show signup page
   ↓
4. User fills form and clicks Sign Up
   ↓
5. Frontend calls fetch(API_ENDPOINTS.auth.register)
   ↓
6. API_ENDPOINTS.auth.register = "http://localhost:8000/auth/register"
   ↓
7. Backend receives request, creates user, returns token
   ↓
8. Frontend receives response
   ↓
9. Response.ok = true → Success
   ↓
10. setToken(data.access_token) saves token to localStorage
    ↓
11. router.push('/dashboard') redirects
    ↓
12. AuthProvider detects token in localStorage
    ↓
13. User can see dashboard
    ↓
14. User refreshes page
    ↓
15. AuthProvider checks localStorage again
    ↓
16. Token exists → Session restored
    ↓
17. User stays on dashboard ✅
```

---

## Success Indicators

✅ You're done when:

- [ ] No 404 error on signup
- [ ] Token appears in localStorage
- [ ] Can refresh page and stay logged in
- [ ] Can login with credentials
- [ ] Login redirects to dashboard
- [ ] Logout clears token

---

## Common Passwords That Work

These all meet the requirements (12+ chars, uppercase, number, special):

✅ Working examples:
- `TestPass123!`
- `SecurePass@123`
- `MyP@ssword123`
- `Admin#2024Auth`
- `Welcome$Pass99`

❌ Won't work:
- `password` (no uppercase, number, special)
- `Password1` (too short, no special)
- `TEST!@#$` (no number, too short)

---

## Next: Deploy to Production

Once testing works locally, to deploy:

1. Create `.env.local` in `frontend/` folder
2. Add: `NEXT_PUBLIC_API_URL=https://your-backend-domain.com`
3. Deploy frontend
4. Deploy backend to your domain

The API calls will automatically use the production URL!

---

## You Got This! 🚀

Test it now and let me know how it goes!
