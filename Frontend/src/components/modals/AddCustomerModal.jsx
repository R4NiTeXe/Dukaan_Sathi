'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2, AlertCircle, UserPlus, Sparkles } from 'lucide-react';
import api from '@/services/api';

export default function AddCustomerModal({ isOpen, onClose, onCustomerAdded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCreated(null);

    try {
      const response = await api.post('/customers', {});
      if (response.data.success) {
        setCreated(response.data.data.customer);
        if (onCustomerAdded) onCustomerAdded();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Customer">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div
            role="alert"
            className="bg-muted-red/10 border-muted-red/20 text-muted-red flex items-center gap-2 rounded-xl border p-3 text-sm"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {created ? (
          <div className="bg-sage-green/10 border-sage-green/30 rounded-xl border p-4 text-center">
            <p className="mb-1 text-sm text-neutral-600">Customer created with number</p>
            <p className="text-forest-green font-mono text-lg font-bold">
              {created.customerNumber}
            </p>
          </div>
        ) : (
          <div className="bg-warm-ivory border-soft-stone flex items-start gap-3 rounded-xl border p-4">
            <Sparkles className="text-forest-green mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm text-neutral-600">
              A customer number (e.g. <span className="font-mono">CUST-…-001</span>) will be
              assigned automatically. No other details are needed.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-off-white border-soft-stone hover:bg-soft-stone/50 flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {created ? 'Close' : 'Cancel'}
          </button>
          {!created && (
            <button
              type="submit"
              disabled={loading}
              className="bg-forest-green text-warm-ivory shadow-forest-green/20 hover:bg-forest-green/90 flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium shadow-md transition-colors"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Customer
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
