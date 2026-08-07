'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '@/utils/animations';
import {
  Palette,
  Languages,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { LANGUAGES } from '@/constants/navigation';
import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';

const THEMES = [
  { value: 'system', label: 'System default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState(user?.preferredLanguage || 'en');
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLanguage(user?.preferredLanguage || 'en');
  }, [user?.preferredLanguage]);

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleLanguageChange = async (value) => {
    setLanguage(value);
    setSavingLanguage(true);
    setError('');
    try {
      const response = await api.put('/auth/profile', { preferredLanguage: value });
      if (response.data.success) {
        await refreshProfile();
        notify('Preferred language saved');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save language setting');
      setLanguage(user?.preferredLanguage || 'en');
    } finally {
      setSavingLanguage(false);
    }
  };

  if (!mounted) {
    return <div className="mx-auto max-w-3xl min-w-0 space-y-8" />;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto max-w-3xl min-w-0 space-y-8"
    >
      <PageHeader title="Settings" description="Manage your preferences and account." />

      {message && (
        <div className="bg-emerald/10 border-emerald/20 text-emerald flex items-center gap-3 rounded-2xl border p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>{message}</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="bg-muted-red/10 border-muted-red/20 text-muted-red flex items-center gap-3 rounded-2xl border p-4"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-off-white border-soft-stone flex flex-col gap-6 rounded-2xl border p-6 shadow-[var(--shadow-soft)] md:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
          <Palette className="text-forest-green h-5 w-5" /> Appearance
        </h2>
        <p className="-mt-4 text-sm text-neutral-500">
          Choose how the app looks on this device. Your choice is remembered locally.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {THEMES.map((option) => {
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={isActive}
                className={`border-soft-stone focus:border-sage-green flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all focus:outline-none ${
                  isActive
                    ? 'bg-sage-green/10 border-sage-green text-forest-green'
                    : 'hover:bg-soft-stone/40 text-neutral-600'
                }`}
              >
                {isActive && <span className="bg-forest-green h-2 w-2 rounded-full" />}
                {option.label}
              </button>
            );
          })}
        </div>
        {mounted && (
          <p className="text-xs text-neutral-400">
            Currently using: {resolvedTheme === 'dark' ? 'Dark' : 'Light'} mode
          </p>
        )}
      </div>

      <div className="bg-off-white border-soft-stone space-y-6 rounded-2xl border p-6 shadow-[var(--shadow-soft)] md:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
          <Languages className="text-forest-green h-5 w-5" /> Preferences
        </h2>
        <div className="max-w-xs">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Preferred billing language
          </label>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={savingLanguage}
            className="bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green/20 w-full rounded-xl border px-4 py-3 text-sm text-neutral-700 transition-all focus:ring-2 focus:outline-none disabled:opacity-60"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          {savingLanguage && (
            <p className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </p>
          )}
          <p className="mt-2 text-xs text-neutral-400">
            Used as the default language for voice billing.
          </p>
        </div>
      </div>

      <div className="bg-off-white border-soft-stone flex flex-col gap-6 rounded-2xl border p-6 shadow-[var(--shadow-soft)] md:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
          <ShieldCheck className="text-forest-green h-5 w-5" /> Account
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar src={user?.avatar} name={user?.ownerName} size="lg" />
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900">{user?.ownerName}</p>
            <p className="text-sm text-neutral-500">{user?.email}</p>
            <p className="mt-1 text-xs text-neutral-400">
              Shop: {user?.shopName || '—'}
              {user?.createdAt &&
                ` · Member since ${new Date(user.createdAt).toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}`}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}