'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SHOP_TYPES } from '@/constants/navigation';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    password: '',
    shopName: '',
    shopType: 'grocery',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await register(formData);

    if (!result.success) {
      setError(result.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-warm-ivory flex min-h-screen items-center justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-off-white border-soft-stone w-full max-w-md rounded-xl border p-8 shadow-[var(--shadow-hover)]"
      >
        <div className="mb-8 text-center">
          <div className="bg-forest-green text-warm-ivory mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-neutral-500">Join Dukaan Saathi to manage your store</p>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-muted-red/10 border-muted-red/20 text-muted-red mb-6 flex flex-col gap-1 rounded-xl border p-4 text-sm"
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>Registration Failed</span>
            </div>
            {typeof error === 'string' ? (
              <p className="pl-7 opacity-90">{error}</p>
            ) : (
              <ul className="list-disc pl-10 opacity-90">
                {Array.isArray(error) && error.map((e, i) => <li key={i}>{e.message || e}</li>)}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-medium text-neutral-700">Full Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <User className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="Rahul Sharma"
                className="bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green/20 w-full rounded-xl border py-3 pr-4 pl-11 text-sm shadow-sm transition-all focus:ring-2 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-medium text-neutral-700">Shop Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Store className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                required
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                placeholder="Sharma Kirana Store"
                className="bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green/20 w-full rounded-xl border py-3 pr-4 pl-11 text-sm shadow-sm transition-all focus:ring-2 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-medium text-neutral-700">Shop Type</label>
            <div className="relative">
              <select
                required
                value={formData.shopType}
                onChange={(e) => setFormData({ ...formData, shopType: e.target.value })}
                className="bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green/20 w-full appearance-none rounded-xl border px-4 py-3 text-sm shadow-sm transition-all focus:ring-2 focus:outline-none"
              >
                {SHOP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-medium text-neutral-700">Email Address</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Mail className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@store.com"
                className="bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green/20 w-full rounded-xl border py-3 pr-4 pl-11 text-sm shadow-sm transition-all focus:ring-2 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-medium text-neutral-700">Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Lock className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green/20 w-full rounded-xl border py-3 pr-12 pl-11 text-sm shadow-sm transition-all focus:ring-2 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 transition-colors hover:text-neutral-600 focus:outline-none focus-visible:text-neutral-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button type="submit" loading={isLoading} className="mt-2 w-full py-3.5">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link href="/login" className="text-forest-green font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
