'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Package, Hash, IndianRupee, Loader2, AlertCircle } from 'lucide-react';
import api from '@/services/api';

export default function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    price: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
      };

      const response = await api.post('/products', payload);
      if (response.data.success) {
        if (onProductAdded) onProductAdded();
        setFormData({ name: '', unit: 'kg', price: '' });
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Product">
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Product Name</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Package className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Aashirvaad Atta"
              className="bg-off-white border-soft-stone focus:border-sage-green focus:ring-sage-green w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm transition-all focus:ring-1 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Unit</label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="bg-off-white border-soft-stone focus:border-sage-green w-full rounded-xl border px-4 py-2.5 text-sm text-neutral-700 transition-all focus:outline-none"
          >
            <option value="kg">kg</option>
            <option value="L">Litre</option>
            <option value="pcs">Piece</option>
            <option value="pkt">Packet</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Price</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <IndianRupee className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              className="bg-off-white border-soft-stone focus:border-sage-green w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm transition-all focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-off-white border-soft-stone hover:bg-soft-stone/50 flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-forest-green text-warm-ivory shadow-forest-green/20 hover:bg-forest-green/90 flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium shadow-md transition-colors"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
