'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Package, Hash, IndianRupee, Loader2, AlertCircle } from 'lucide-react';
import api from '@/services/api';

export default function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Grocery',
    unit: 'kg',
    price: '',
    stock: ''
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
        stock: Number(formData.stock)
      };
      
      const response = await api.post('/products', payload);
      if (response.data.success) {
        if (onProductAdded) onProductAdded();
        setFormData({ name: '', category: 'Grocery', unit: 'kg', price: '', stock: '' });
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
          <div className="p-3 bg-muted-red/10 border border-muted-red/20 rounded-xl flex items-center gap-2 text-muted-red text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Product Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Package className="h-4 w-4 text-neutral-400" />
            </div>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Aashirvaad Atta"
              className="w-full pl-10 pr-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Category</label>
            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all text-neutral-700"
            >
              <option value="Grocery">Grocery</option>
              <option value="Dairy">Dairy</option>
              <option value="Snacks">Snacks</option>
              <option value="Beverages">Beverages</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Unit</label>
            <select 
              value={formData.unit}
              onChange={e => setFormData({...formData, unit: e.target.value})}
              className="w-full px-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all text-neutral-700"
            >
              <option value="kg">kg</option>
              <option value="L">Litre</option>
              <option value="pcs">Piece</option>
              <option value="pkt">Packet</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Price</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-4 w-4 text-neutral-400" />
              </div>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Initial Stock</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-4 w-4 text-neutral-400" />
              </div>
              <input 
                type="number" 
                required
                min="0"
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: e.target.value})}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-off-white border border-soft-stone rounded-xl text-sm font-medium hover:bg-soft-stone/50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-forest-green text-warm-ivory rounded-xl text-sm font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
