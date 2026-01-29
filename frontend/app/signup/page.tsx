'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { setToken } from '@/lib/auth';
import { API_ENDPOINTS } from '@/config/api';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // Validate password requirements
  const validatePassword = (password: string) => {
    setPasswordValidation({
      minLength: password.length >= 12,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation checks
    if (!formData.fullName.trim()) {
      setError('Full name is required.');
      setLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 12) {
      setError('Password must be at least 12 characters long.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Send signup request to backend
      // Note: API_ENDPOINTS.auth.register resolves to http://localhost:8000/auth/register
      // This is based on your FastAPI router with prefix="/auth" and endpoint /register
      const response = await fetch(API_ENDPOINTS.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
        }),
      });

      // Parse response data
      const data = await response.json();

      // Handle error response from backend
      if (!response.ok) {
        const errorMessage =
          data.detail ||
          data.message ||
          data.error ||
          `Signup failed (${response.status}). Please check your information.`;
        setError(errorMessage);
        console.error('Signup error response:', data);
        setLoading(false);
        return;
      }

      // Success: Save token and redirect
      if (data.access_token) {
        setToken(data.access_token);
        localStorage.setItem('tokenType', data.token_type || 'bearer');
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        // User is auto-logged in, redirect to dashboard
        router.push('/dashboard');
      } else {
        // Fallback: No token received, redirect to login
        router.push('/login');
      }
    } catch (err) {
      console.error('Signup network error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Network error occurred';
      setError(`Network error: ${errorMsg}. Please check if the backend is running at ${API_ENDPOINTS.auth.register}`);
      setLoading(false);
    }
  };

  const isPasswordValid =
    passwordValidation.minLength &&
    passwordValidation.hasUppercase &&
    passwordValidation.hasNumber &&
    passwordValidation.hasSpecial;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Signup card */}
      <div className="relative w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <Shield className="w-8 h-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-bold text-white">SentinelShield AI</h1>
          </div>

          <h2 className="text-xl font-semibold text-center text-slate-100 mb-2">
            Create Account
          </h2>
          <p className="text-center text-slate-400 mb-8">
            Join us to start monitoring threats in real-time
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Signup form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name field */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                required
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* Password validation indicators */}
              {formData.password && (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    {passwordValidation.minLength ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 border border-slate-500 rounded-full"></div>
                    )}
                    <span
                      className={
                        passwordValidation.minLength
                          ? 'text-green-400'
                          : 'text-slate-400'
                      }
                    >
                      At least 12 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.hasUppercase ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 border border-slate-500 rounded-full"></div>
                    )}
                    <span
                      className={
                        passwordValidation.hasUppercase
                          ? 'text-green-400'
                          : 'text-slate-400'
                      }
                    >
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.hasNumber ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 border border-slate-500 rounded-full"></div>
                    )}
                    <span
                      className={
                        passwordValidation.hasNumber
                          ? 'text-green-400'
                          : 'text-slate-400'
                      }
                    >
                      One number
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.hasSpecial ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 border border-slate-500 rounded-full"></div>
                    )}
                    <span
                      className={
                        passwordValidation.hasSpecial
                          ? 'text-green-400'
                          : 'text-slate-400'
                      }
                    >
                      One special character
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••••••"
                required
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match
                  </p>
                )}
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="mt-2 text-xs text-red-400">
                    Passwords do not match
                  </p>
                )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={
                loading ||
                !isPasswordValid ||
                !formData.confirmPassword ||
                formData.password !== formData.confirmPassword
              }
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 transition font-medium"
            >
              Sign in here
            </Link>
          </div>

          {/* Terms notice */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded border border-slate-600/50">
            <p className="text-xs text-slate-400 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
