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
          <div className="p-3 bg-muted-red/10 border border-muted-red/20 rounded-xl flex items-center gap-2 text-muted-red text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {created ? (
          <div className="p-4 bg-sage-green/10 border border-sage-green/30 rounded-xl text-center">
            <p className="text-sm text-neutral-600 mb-1">Customer created with number</p>
            <p className="font-mono font-bold text-forest-green text-lg">{created.customerNumber}</p>
          </div>
        ) : (
          <div className="p-4 bg-warm-ivory border border-soft-stone rounded-xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-forest-green shrink-0 mt-0.5" />
            <p className="text-sm text-neutral-600">
              A customer number (e.g. <span className="font-mono">CUST-…-001</span>) will be
              assigned automatically. No other details are needed.
            </p>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-off-white border border-soft-stone rounded-xl text-sm font-medium hover:bg-soft-stone/50 transition-colors"
          >
            {created ? 'Close' : 'Cancel'}
          </button>
          {!created && (
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-forest-green text-warm-ivory rounded-xl text-sm font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors flex justify-center items-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
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
