'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, AlertCircle, Loader } from 'lucide-react';
import { setToken } from '@/lib/auth';
import { API_ENDPOINTS } from '@/config/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare form data for FastAPI OAuth2 endpoint
      // Note: OAuth2PasswordRequestForm requires 'username' field (not 'email')
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      // Send login request to backend
      // API_ENDPOINTS.auth.login = http://localhost:8000/auth/token
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        body: formData,
      });

      // Parse response from backend
      const data = await response.json();

      // Handle error response
      if (!response.ok) {
        const errorMessage =
          data.detail ||
          data.message ||
          data.error ||
          `Login failed (${response.status}). Please check your credentials.`;
        setError(errorMessage);
        console.error('Login error response:', data);
        setLoading(false);
        return;
      }

      // Extract JWT token from response
      const token = data.access_token;
      if (!token) {
        setError('No token received from server. Please try again.');
        setLoading(false);
        return;
      }

      // Success: Save token to localStorage
      setToken(token);
      localStorage.setItem('tokenType', data.token_type || 'bearer');

      // Save user info if provided by backend
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Login network error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Network error occurred';
      setError(`Network error: ${errorMsg}. Please check if the backend is running at ${API_ENDPOINTS.auth.login}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <Shield className="w-8 h-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-white">SentinelShield AI</h1>
          </div>

          <h2 className="text-xl font-semibold text-center text-slate-100 mb-2">
            Welcome Back
          </h2>
          <p className="text-center text-slate-400 mb-8">
            Sign in to your account to continue
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end">
              <Link
                href="#"
                className="text-sm text-blue-400 hover:text-blue-300 transition"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition font-medium">
              Sign up here
            </Link>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded border border-slate-600/50">
            <p className="text-xs text-slate-400 text-center">
              Demo: Use your registered credentials to login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
