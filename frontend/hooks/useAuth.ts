'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isAuthenticated } from '@/lib/auth';

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if token exists in localStorage on mount
    const storedToken = getToken();
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  return {
    token,
    isAuthenticated: !!token,
    isLoading,
  };
};

export const useAuthProtected = (redirectToLogin = true) => {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !token && redirectToLogin) {
      router.push('/login');
    }
  }, [token, isLoading, router, redirectToLogin]);

  return { token, isLoading };
};
