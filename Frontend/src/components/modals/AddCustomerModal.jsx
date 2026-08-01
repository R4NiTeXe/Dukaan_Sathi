'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { User, Phone, Mail, MapPin, Loader2, AlertCircle } from 'lucide-react';
import api from '@/services/api';

export default function AddCustomerModal({ isOpen, onClose, onCustomerAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/customers', formData);
      if (response.data.success) {
        if (onCustomerAdded) onCustomerAdded();
        setFormData({ name: '', phone: '', email: '', address: '' });
        onClose();
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-neutral-400" />
            </div>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Rahul Sharma"
              className="w-full pl-10 pr-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-neutral-400" />
              </div>
              <input 
                type="tel" 
                required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="+91"
                className="w-full pl-10 pr-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Email (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-neutral-400" />
              </div>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Address (Optional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
              <MapPin className="h-4 w-4 text-neutral-400" />
            </div>
            <textarea 
              rows={3}
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="123 Street Name, City"
              className="w-full pl-10 pr-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all resize-none"
            />
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
            className="flex-1 py-2.5 px-4 bg-forest-green text-warm-ivory rounded-xl text-sm font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors flex justify-center items-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
