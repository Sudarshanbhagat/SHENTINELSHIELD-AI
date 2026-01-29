'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { useTenantStore } from '@/lib/stores/tenant';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'analyst' | 'viewer';
}

/**
 * Higher-Order Component for protecting routes
 * Checks for valid JWT and tenant context before rendering children
 * 
 * Usage:
 * <ProtectedRoute requiredRole="admin">
 *   <DashboardPage />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { token, user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { tenantId, isLoading: tenantLoading } = useTenantStore();

  useEffect(() => {
    // Check authentication
    if (!authLoading && !isAuthenticated) {
      console.warn('ProtectedRoute: User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Check tenant context
    if (!tenantLoading && !tenantId) {
      console.warn('ProtectedRoute: No tenant context, redirecting to setup');
      router.push('/onboarding');
      return;
    }

    // Check JWT expiration
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000; // Convert to milliseconds
        
        if (Date.now() > expiresAt) {
          console.warn('ProtectedRoute: JWT expired, logging out');
          useAuthStore.getState().logout();
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('ProtectedRoute: Failed to validate JWT', error);
        useAuthStore.getState().logout();
        router.push('/login');
        return;
      }
    }

    // Check role-based access
    if (requiredRole && user && user.role !== requiredRole && user.role !== 'admin') {
      console.warn(`ProtectedRoute: User role ${user.role} does not match required role ${requiredRole}`);
      router.push('/dashboard');
      return;
    }
  }, [token, user, isAuthenticated, tenantId, authLoading, tenantLoading, requiredRole, router]);

  // Show loading state while checking authentication
  if (authLoading || tenantLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Redirect if no tenant
  if (!tenantId) {
    return null;
  }

  // Check role access
  if (requiredRole && user && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <p className="text-slate-300 mb-4">You don't have permission to access this page</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to check if current user has required role
 * 
 * Usage:
 * const { isAdmin, canView } = useRoleCheck();
 */
export function useRoleCheck() {
  const { user } = useAuthStore();

  return {
    isAdmin: user?.role === 'admin',
    isAnalyst: user?.role === 'analyst',
    isViewer: user?.role === 'viewer',
    canView: !!user,
    canEdit: user?.role === 'admin' || user?.role === 'analyst',
    canRevoke: user?.role === 'admin',
    canManageUsers: user?.role === 'admin',
  };
}
