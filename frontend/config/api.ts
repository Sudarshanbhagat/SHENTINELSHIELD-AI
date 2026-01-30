/**
 * API Configuration
 * Centralized configuration for all backend API calls
 */

// Base URL for backend API
// Note: Using 127.0.0.1:8000 for local development (more reliable than localhost)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/token`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/users/me`,
  },
  // Health check
  health: `${API_BASE_URL}/health`,
};

/**
 * How to use this file:
 * 
 * In signup/page.tsx:
 *   import { API_ENDPOINTS } from '@/config/api';
 *   const response = await fetch(API_ENDPOINTS.auth.register, {...})
 * 
 * In login/page.tsx:
 *   import { API_ENDPOINTS } from '@/config/api';
 *   const response = await fetch(API_ENDPOINTS.auth.login, {...})
 * 
 * To change the backend URL for production:
 *   Create a .env.local file with: NEXT_PUBLIC_API_URL=https://your-backend.com
 *   Next.js will automatically use that instead of http://localhost:8000
 */

/**
 * Verify Your Backend Endpoint
 * 
 * Method 1: Check FastAPI Router Prefix
 * File: backend/app/routers/auth.py
 * Look for: router = APIRouter(prefix="/auth", ...)
 * 
 * Method 2: Check if router is included in main.py
 * File: backend/app/main.py
 * Look for: app.include_router(auth_router)
 * 
 * Method 3: Visit the docs
 * Go to: http://localhost:8000/docs
 * Look for: POST /auth/register and POST /auth/token
 * 
 * Your setup:
 * - FastAPI prefix: /auth
 * - Endpoint: /register
 * - Full URL: http://localhost:8000/auth/register ✅
 * 
 * Common wrong paths:
 * - http://localhost:8000/register (missing /auth prefix)
 * - http://localhost:8000/api/auth/register (extra /api)
 * - http://localhost:8000/api/register (completely wrong)
 */
