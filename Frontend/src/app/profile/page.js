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
      className="max-w-6xl mx-auto space-y-8 min-w-0"
    >
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">
            Shop Profile
          </h1>
          <p className="text-neutral-500 mt-1">Manage your shop and payment details.</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Summary & QR */}
        <div className="lg:col-span-1 space-y-8">
          {/* Profile Summary Card */}
          <div className="bg-gradient-to-b from-forest-green to-[#1e293b] rounded-[24px] p-6 shadow-lg border border-soft-stone flex flex-col items-center text-center text-warm-ivory relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Store className="w-24 h-24" />
             </div>
             <div className="w-24 h-24 rounded-full bg-warm-ivory text-forest-green flex items-center justify-center text-4xl font-bold mb-4 shadow-xl border-4 border-white/20 relative z-10">
               {form?.shopName ? form.shopName.charAt(0).toUpperCase() : <Store className="w-10 h-10" />}
             </div>
             <h2 className="text-2xl font-bold mb-1 relative z-10">{form.shopName || 'Your Shop'}</h2>
             <p className="text-sm text-warm-ivory/80 mb-4 relative z-10">{form.ownerName || 'Owner'}</p>
             <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider relative z-10 border border-white/10">
               {form.shopType || 'Shop'}
             </span>
          </div>

          {/* QR Code Section */}
          <div className="bg-off-white rounded-[24px] p-6 shadow-[var(--shadow-soft)] border border-soft-stone flex flex-col">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2 mb-6">
              <QrCode className="w-5 h-5 text-forest-green" /> UPI QR Code
            </h2>

            {user?.upiQrCode ? (
              <div className="flex flex-col items-center gap-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.upiQrCode}
                  alt="UPI QR code"
                  className="w-48 h-48 rounded-2xl border-2 border-sage-green/30 object-contain bg-warm-ivory p-2 shadow-sm"
                />
                <div className="flex gap-3 w-full">
                  <label className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-sage-green text-forest-green rounded-xl font-medium hover:bg-sage-green/80 transition-colors cursor-pointer text-sm">
                    <Upload className="w-4 h-4" />
                    Replace
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
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-muted-red/10 text-muted-red rounded-xl font-medium hover:bg-muted-red/20 transition-colors disabled:opacity-70 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-soft-stone rounded-2xl cursor-pointer hover:border-sage-green hover:bg-sage-green/5 transition-colors h-48">
                {qrUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-forest-green" />
                ) : (
                  <QrCode className="w-10 h-10 text-neutral-300" />
                )}
                <span className="text-sm text-neutral-500 text-center px-4">
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
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-off-white rounded-[24px] p-6 md:p-8 shadow-[var(--shadow-soft)] border border-soft-stone space-y-6">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2 mb-2">
              <Store className="w-5 h-5 text-forest-green" /> Shop Details
            </h2>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Owner Name</label>
              <input
                type="text"
                required
                value={form.ownerName || ''}
                onChange={(e) => set('ownerName', e.target.value)}
                className="w-full px-4 py-3 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Shop Name</label>
                <input
                  type="text"
                  required
                  value={form.shopName || ''}
                  onChange={(e) => set('shopName', e.target.value)}
                  className="w-full px-4 py-3 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Shop Type</label>
                <select
                  value={form.shopType || 'grocery'}
                  onChange={(e) => set('shopType', e.target.value)}
                  className="w-full px-4 py-3 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all text-neutral-700"
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
                className="w-full px-4 py-3 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-neutral-400" /> Preferred Language
              </label>
              <select
                value={form.preferredLanguage || 'en'}
                onChange={(e) => set('preferredLanguage', e.target.value)}
                className="w-full px-4 py-3 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all text-neutral-700"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-400 pt-1">
                Used as the default language for voice billing.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-soft-stone/50">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-forest-green text-warm-ivory rounded-xl font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
