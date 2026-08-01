'use client';

import Modal from '@/components/ui/Modal';
import { Package, Hash, IndianRupee } from 'lucide-react';

export default function AddProductModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Product">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Product Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Package className="h-4 w-4 text-neutral-400" />
            </div>
            <input 
              type="text" 
              placeholder="e.g. Aashirvaad Atta"
              className="w-full pl-10 pr-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Category</label>
            <select className="w-full px-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all text-neutral-700">
              <option>Grocery</option>
              <option>Dairy</option>
              <option>Snacks</option>
              <option>Beverages</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">Unit</label>
            <select className="w-full px-4 py-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-all text-neutral-700">
              <option>kg</option>
              <option>Litre</option>
              <option>Piece</option>
              <option>Packet</option>
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
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-forest-green text-warm-ivory rounded-xl text-sm font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors"
          >
            Save Product
          </button>
        </div>
      </form>
    </Modal>
  );
}
