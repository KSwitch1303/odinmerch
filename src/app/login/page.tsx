'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function LoginInner() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/account';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) {
        setError(error.message || 'Login failed');
      } else if (data.user) {
        router.push(nextPath);
      } else {
        setError('Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${nextPath}`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) setError(error.message);
    } catch (e) {
      setError('OAuth error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your luxury account</p>
        </div>

        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link href="/forgot-password" className="text-black hover:text-gray-700">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full luxury-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => signInWithProvider('google')}
                className="w-full border border-gray-300 rounded-lg py-3 text-sm font-medium text-black bg-white hover:bg-gray-50 flex items-center justify-center gap-2"
                disabled={loading}
                type="button"
              >
                <span>Sign in with</span>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="block shrink-0">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.72 1.22 9.24 3.61l6.9-6.9C35.9 2.39 30.37 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.05 6.26C12.46 13.09 17.77 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.5 24.5c0-1.59-.14-3.12-.41-4.6H24v8.7h12.7c-.55 2.95-2.22 5.45-4.73 7.14l7.24 5.62c4.23-3.9 6.69-9.64 6.69-16.86z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.61 28.52A14.5 14.5 0 0 1 9.85 24c0-1.56.27-3.07.76-4.52l-8.05-6.26A23.97 23.97 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l8.05-6.26z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.37 0 11.73-2.11 15.64-5.74l-7.24-5.62c-2.01 1.35-4.58 2.15-8.4 2.15-6.23 0-11.54-3.59-13.39-8.98l-8.05 6.26C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
              </button>
              <button
                onClick={() => signInWithProvider('apple')}
                className="w-full border border-gray-300 rounded-lg py-3 text-sm font-medium text-black bg-white hover:bg-gray-50 flex items-center justify-center gap-2"
                disabled={loading}
                type="button"
              >
                <span>Sign in with</span>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="block shrink-0">
                  <path
                    fill="currentColor"
                    d="M16.365 1.43c0 1.14-.42 2.21-1.2 3.09-.83.93-2.19 1.64-3.36 1.55-.14-1.12.42-2.28 1.18-3.11.84-.93 2.27-1.61 3.38-1.53Zm3.43 16.53c-.56 1.29-.83 1.87-1.55 3.01-.99 1.58-2.38 3.55-4.1 3.57-1.52.02-1.92-.99-3.99-.98-2.07.01-2.51 1-4.02.98-1.72-.02-3.03-1.8-4.02-3.37C.62 18.67.42 15.81 1.7 13.56c.92-1.62 2.37-2.57 3.74-2.57 1.47 0 2.39 1.02 4.01 1.02 1.58 0 2.54-1.02 4-1.02 1.22 0 2.51.67 3.43 1.82-3.01 1.65-2.52 5.96.95 7.15Z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-black hover:text-gray-700 font-medium">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
