'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '@/utils/animations';
import {
  Store,
  MapPin,
  Languages,
  QrCode,
  Upload,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
];

const SHOP_TYPES = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'other', label: 'Other' },
];

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [setupMode, setSetupMode] = useState(false);

  useEffect(() => {
    setSetupMode(new URLSearchParams(window.location.search).get('setup') === '1');
    setForm({
      ownerName: user?.ownerName || '',
      shopName: user?.shopName || '',
      shopType: user?.shopType || 'grocery',
      shopAddress: user?.shopAddress || '',
      preferredLanguage: user?.preferredLanguage || 'en',
    });
  }, [user]);

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.put('/auth/profile', form);
      if (response.data.success) {
        await refreshProfile();
        notify('Profile updated');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('upiQrCode', file);
      const response = await api.put('/auth/profile', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        await refreshProfile();
        notify('UPI QR code uploaded');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'QR upload failed');
    } finally {
      setQrUploading(false);
      e.target.value = '';
    }
  };

  const handleQrRemove = async () => {
    setQrUploading(true);
    setError('');
    try {
      const response = await api.put('/auth/profile', { upiQrCode: '' });
      if (response.data.success) {
        await refreshProfile();
        notify('UPI QR code removed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove QR code');
    } finally {
      setQrUploading(false);
    }
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-2xl mx-auto space-y-8 min-w-0"
    >
      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">
          Shop Profile
        </h1>
        <p className="text-neutral-500 mt-1">Manage your shop and payment details.</p>
      </header>

      {setupMode && !user?.upiQrCode && (
        <div className="p-4 bg-sage-green/10 border border-sage-green/30 rounded-2xl flex items-center gap-3 text-forest-green">
          <QrCode className="w-5 h-5 shrink-0" />
          <p className="text-sm">
            Welcome! Upload your UPI QR code below so customers can pay you.
          </p>
        </div>
      )}

      {message && (
        <div className="p-4 bg-emerald/10 border border-emerald/20 rounded-2xl flex items-center gap-3 text-emerald">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{message}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-muted-red/10 border border-muted-red/20 rounded-2xl flex items-center gap-3 text-muted-red">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-off-white rounded-[24px] p-6 md:p-8 shadow-[var(--shadow-soft)] border border-soft-stone space-y-5">
        <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          <Store className="w-5 h-5 text-forest-green" /> Shop Details
        </h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Owner Name</label>
          <input
            type="text"
            required
            value={form.ownerName || ''}
            onChange={(e) => set('ownerName', e.target.value)}
            className="w-full px-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Shop Name</label>
            <input
              type="text"
              required
              value={form.shopName || ''}
              onChange={(e) => set('shopName', e.target.value)}
              className="w-full px-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Shop Type</label>
            <select
              value={form.shopType || 'grocery'}
              onChange={(e) => set('shopType', e.target.value)}
              className="w-full px-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all text-neutral-700"
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
          <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-neutral-400" /> Shop Address (optional)
          </label>
          <input
            type="text"
            value={form.shopAddress || ''}
            onChange={(e) => set('shopAddress', e.target.value)}
            placeholder="123 Street, City"
            className="w-full px-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-neutral-400" /> Preferred Language
          </label>
          <select
            value={form.preferredLanguage || 'en'}
            onChange={(e) => set('preferredLanguage', e.target.value)}
            className="w-full px-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all text-neutral-700"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-400">
            Used as the default language for voice billing.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-forest-green text-warm-ivory rounded-xl font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>

      <div className="bg-off-white rounded-[24px] p-6 md:p-8 shadow-[var(--shadow-soft)] border border-soft-stone">
        <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-forest-green" /> UPI QR Code
        </h2>

        {user?.upiQrCode ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.upiQrCode}
              alt="UPI QR code"
              className="w-40 h-40 rounded-2xl border border-soft-stone object-contain bg-warm-ivory"
            />
            <div className="flex flex-col gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-sage-green text-forest-green rounded-xl font-medium hover:bg-sage-green/80 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Replace QR
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleQrUpload}
                  disabled={qrUploading}
                />
              </label>
              <button
                onClick={handleQrRemove}
                disabled={qrUploading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-muted-red/10 text-muted-red rounded-xl font-medium hover:bg-muted-red/20 transition-colors disabled:opacity-70"
              >
                <Trash2 className="w-4 h-4" />
                Remove QR
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-soft-stone rounded-2xl cursor-pointer hover:border-sage-green hover:bg-sage-green/5 transition-colors">
            {qrUploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-forest-green" />
            ) : (
              <QrCode className="w-10 h-10 text-neutral-300" />
            )}
            <span className="text-sm text-neutral-500">
              {qrUploading ? 'Uploading...' : 'Click to upload your UPI QR code'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleQrUpload}
              disabled={qrUploading}
            />
          </label>
        )}
      </div>
    </motion.div>
  );
}
