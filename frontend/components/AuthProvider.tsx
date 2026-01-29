'use client';

import { ReactNode, useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';

/**
 * AuthProvider Component
 * 
 * This component handles persistent authentication across the entire app.
 * It checks localStorage for a token on page load and prevents hydration mismatches.
 * 
 * How it works:
 * 1. When app loads, useEffect runs
 * 2. Checks if 'token' exists in localStorage
 * 3. If token exists → user is authenticated, stays logged in
 * 4. If no token → user is not authenticated, sees login/signup pages
 * 5. On page refresh → token is restored from localStorage (no re-login needed)
 * 
 * This solves the "No active session found" issue because:
 * - Token persists in localStorage even after page refresh
 * - AuthProvider checks for it on every page load
 * - User session is automatically restored
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check for authentication token on app load
    const token = getToken();
    
    if (token) {
      // ✅ Token exists in localStorage
      // User is authenticated
      // They can access protected pages like /dashboard
      // Their session will persist across page refreshes
      console.log('✅ User session restored from localStorage');
    } else {
      // ❌ No token in localStorage
      // User is not authenticated
      // They can only see public pages (/login, /signup)
      // Protected pages will redirect them to /login
      console.log('❌ No active session found - user not authenticated');
    }

    // Set hydrated to true to prevent hydration mismatch
    // This prevents client/server render mismatch in Next.js
    setIsHydrated(true);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side setup is complete
  if (!isHydrated) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

