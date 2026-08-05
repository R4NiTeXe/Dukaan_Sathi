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
import { LANGUAGES, SHOP_TYPES } from '@/constants/navigation';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

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
      className="mx-auto max-w-6xl min-w-0 space-y-8"
    >
      <PageHeader title="Shop Profile" description="Manage your shop and payment details." />

      {setupMode && !user?.upiQrCode && (
        <div className="bg-sage-green/10 border-sage-green/30 text-forest-green flex items-center gap-3 rounded-2xl border p-4">
          <QrCode className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Welcome! Upload your UPI QR code below so customers can pay you.
          </p>
        </div>
      )}

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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Summary & QR */}
        <div className="space-y-8 lg:col-span-1">
          {/* Profile Summary Card */}
          <div className="from-forest-green border-soft-stone text-warm-ivory relative flex flex-col items-center overflow-hidden rounded-2xl border bg-gradient-to-b to-[#1e293b] p-6 text-center shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Store className="h-24 w-24" />
            </div>
            <div className="bg-warm-ivory text-forest-green relative z-10 mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 text-4xl font-bold shadow-xl">
              {form?.shopName ? (
                form.shopName.charAt(0).toUpperCase()
              ) : (
                <Store className="h-10 w-10" />
              )}
            </div>
            <h2 className="relative z-10 mb-1 text-2xl font-bold">
              {form.shopName || 'Your Shop'}
            </h2>
            <p className="text-warm-ivory/80 relative z-10 mb-4 text-sm">
              {form.ownerName || 'Owner'}
            </p>
            <span className="relative z-10 rounded-full border border-white/10 bg-white/20 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
              {form.shopType || 'Shop'}
            </span>
          </div>

          {/* QR Code Section */}
          <div className="bg-off-white border-soft-stone flex flex-col rounded-2xl border p-6 shadow-[var(--shadow-soft)]">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-neutral-900">
              <QrCode className="text-forest-green h-5 w-5" /> UPI QR Code
            </h2>

            {user?.upiQrCode ? (
              <div className="flex flex-col items-center gap-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.upiQrCode}
                  alt="UPI QR code"
                  className="border-sage-green/30 bg-warm-ivory h-48 w-48 rounded-2xl border-2 object-contain p-2 shadow-sm"
                />
                <div className="flex w-full gap-3">
                  <label className="bg-emerald/10 text-emerald hover:bg-emerald/20 flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
                    <Upload className="h-4 w-4" />
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleQrUpload}
                      disabled={qrUploading}
                    />
                  </label>
                  <Button
                    variant="danger"
                    onClick={handleQrRemove}
                    disabled={qrUploading}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="border-soft-stone hover:border-sage-green hover:bg-sage-green/5 flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-colors">
                {qrUploading ? (
                  <Loader2 className="text-forest-green h-8 w-8 animate-spin" />
                ) : (
                  <QrCode className="h-10 w-10 text-neutral-300" />
                )}
                <span className="px-4 text-center text-sm text-neutral-500">
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
          <form
            onSubmit={handleSave}
            className="bg-off-white border-soft-stone space-y-6 rounded-2xl border p-6 shadow-[var(--shadow-soft)] md:p-8"
          >
            <h2 className="font-heading mb-2 flex items-center gap-2 text-lg font-bold text-neutral-900">
              <Store className="text-forest-green h-5 w-5" /> Shop Details
            </h2>

            <Input
              label="Owner Name"
              type="text"
              required
              value={form.ownerName || ''}
              onChange={(e) => set('ownerName', e.target.value)}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Shop Name"
                type="text"
                required
                value={form.shopName || ''}
                onChange={(e) => set('shopName', e.target.value)}
              />

              <Select
                label="Shop Type"
                value={form.shopType || 'grocery'}
                onChange={(e) => set('shopType', e.target.value)}
                options={SHOP_TYPES}
              />
            </div>

            <Input
              label="Shop Address (optional)"
              type="text"
              value={form.shopAddress || ''}
              onChange={(e) => set('shopAddress', e.target.value)}
              placeholder="123 Street, City"
            />

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                <Languages className="h-4 w-4 text-neutral-400" /> Preferred Language
              </label>
              <select
                value={form.preferredLanguage || 'en'}
                onChange={(e) => set('preferredLanguage', e.target.value)}
                className="bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green/20 w-full rounded-xl border px-4 py-3 text-sm text-neutral-700 transition-all focus:ring-2 focus:outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <p className="pt-1 text-xs text-neutral-400">
                Used as the default language for voice billing.
              </p>
            </div>

            <div className="border-soft-stone/50 mt-4 border-t pt-4">
              <Button type="submit" loading={loading} className="w-full sm:w-auto">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
