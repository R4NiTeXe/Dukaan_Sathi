'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(formData);
    
    if (!result.success) {
      setError(result.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-ivory p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-off-white rounded-[32px] p-8 shadow-[var(--shadow-hover)] border border-soft-stone"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-forest-green flex items-center justify-center text-warm-ivory mb-4 shadow-sm">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Welcome back</h1>
          <p className="text-neutral-500 mt-2 text-sm">Sign in to your Dukaan Saathi account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-muted-red/10 border border-muted-red/20 rounded-2xl flex items-center gap-3 text-muted-red text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-neutral-400" />
              </div>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@store.com"
                className="w-full pl-11 pr-4 py-3.5 bg-warm-ivory border border-soft-stone rounded-2xl text-sm focus:outline-none focus:border-sage-green focus:ring-2 focus:ring-sage-green/20 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-neutral-400" />
              </div>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 bg-warm-ivory border border-soft-stone rounded-2xl text-sm focus:outline-none focus:border-sage-green focus:ring-2 focus:ring-sage-green/20 transition-all shadow-sm"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-forest-green text-warm-ivory rounded-2xl text-sm font-bold shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-neutral-500">
          Don't have an account?{' '}
          <Link href="/register" className="text-forest-green font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
