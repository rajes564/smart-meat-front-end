import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../services/api';
import { useAuthStore } from '../store';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Login Page ────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setAuth(
        { name: res.name, role: res.role, mobile: data.mobile, userId: res.userId },
        res.token
      );
      toast.success(`Welcome back, ${res.name}!`);
      if (res.role === 'ADMIN')       navigate('/admin');
      else if (res.role === 'SELLER') navigate('/seller');
      else                            navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center justify-center p-4">
      <div
        className="w-full max-w-sm"
        style={{ animation: 'authFadeUp 0.4s ease forwards' }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm mb-6 transition"
        >
          <ArrowLeft size={15} /> Back to home
        </Link>

        <div className="text-center mb-8">
          <span className="text-4xl">🥩</span>
          <h1 className="font-display text-2xl font-bold text-stone-900 mt-2">Smart Meat Shop</h1>
          <p className="text-sm text-stone-400 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Mobile */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">
                Mobile Number
              </label>
              <input
                {...register('mobile', {
                  required: 'Mobile is required',
                  minLength: { value: 10, message: 'Enter 10-digit mobile' },
                })}
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:border-brand-400 focus:ring-2
                           focus:ring-brand-100 transition"
              />
              {errors.mobile && (
                <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter password"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm pr-10
                             focus:outline-none focus:border-brand-400 focus:ring-2
                             focus:ring-brand-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3
                         font-bold text-sm shadow-brand transition disabled:opacity-60
                         flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-400">
              New customer?{' '}
              <Link to="/register" className="text-brand-500 font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 bg-amber-light border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
          <p className="font-bold mb-1">Demo credentials</p>
          <p>Admin: <span className="font-mono">9000000000</span> / Admin@123</p>
          <p>Seller: <span className="font-mono">9000000001</span> / Admin@123</p>
        </div>
      </div>

      <style>{`
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Register Page ─────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      setAuth(
        { name: res.name, role: res.role, mobile: data.mobile, userId: res.userId },
        res.token
      );
      toast.success(`Welcome, ${res.name}!`);
      navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center justify-center p-4">
      <div
        className="w-full max-w-sm"
        style={{ animation: 'authFadeUp 0.4s ease forwards' }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm mb-6 transition"
        >
          <ArrowLeft size={15} /> Back to home
        </Link>

        <div className="text-center mb-8">
          <span className="text-4xl">🥩</span>
          <h1 className="font-display text-2xl font-bold text-stone-900 mt-2">Create Account</h1>
          <p className="text-sm text-stone-400 mt-1">Join Smart Meat Shop</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Full Name *</label>
              <input
                {...register('name', { required: 'Name is required', minLength: 2 })}
                placeholder="Your full name"
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:border-brand-400 focus:ring-2
                           focus:ring-brand-100 transition"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Mobile Number *</label>
              <input
                {...register('mobile', {
                  required: 'Mobile is required',
                  minLength: { value: 10, message: 'Enter 10-digit mobile' },
                })}
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile"
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:border-brand-400 focus:ring-2
                           focus:ring-brand-100 transition"
              />
              {errors.mobile && (
                <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Email (optional)</label>
              <input
                {...register('email')}
                type="email"
                placeholder="your@email.com"
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:border-brand-400 focus:ring-2
                           focus:ring-brand-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Password *</label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                })}
                type="password"
                placeholder="Min 6 characters"
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:border-brand-400 focus:ring-2
                           focus:ring-brand-100 transition"
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3
                         font-bold text-sm shadow-brand transition disabled:opacity-60
                         flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-400">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-500 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;