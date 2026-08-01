'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { Search, Plus, Edit2, AlertCircle } from 'lucide-react';
import AddProductModal from '@/components/modals/AddProductModal';

const mockProducts = [
  { id: 'P-001', name: 'Aashirvaad Atta', category: 'Grocery', price: 250, stock: 45, unit: '5kg', status: 'In Stock' },
  { id: 'P-002', name: 'Fortune Sunflower Oil', category: 'Grocery', price: 140, stock: 12, unit: '1L', status: 'Low Stock' },
  { id: 'P-003', name: 'Tata Salt', category: 'Grocery', price: 25, stock: 120, unit: '1kg', status: 'In Stock' },
  { id: 'P-004', name: 'Maggi Noodles', category: 'Snacks', price: 56, stock: 0, unit: '4-pack', status: 'Out of Stock' },
  { id: 'P-005', name: 'Amul Butter', category: 'Dairy', price: 54, stock: 24, unit: '100g', status: 'In Stock' },
];

export default function ProductsList() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-6xl mx-auto space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Products Inventory</h1>
          <p className="text-neutral-500 mt-1">Manage your store's items and stock levels.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-forest-green text-warm-ivory rounded-xl font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </header>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
          <h3 className="text-sm font-medium text-neutral-500 mb-1">Total Products</h3>
          <div className="text-3xl font-bold">1,248</div>
        </div>
        <div className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
          <h3 className="text-sm font-medium text-neutral-500 mb-1">Low Stock Items</h3>
          <div className="text-3xl font-bold text-muted-red flex items-center gap-2">
            14 <AlertCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
          <h3 className="text-sm font-medium text-neutral-500 mb-1">Total Inventory Value</h3>
          <div className="text-3xl font-bold text-forest-green">₹1,45,000</div>
        </div>
      </div>

      <div className="bg-off-white rounded-[24px] p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search products by name or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-soft-stone/80 text-sm text-neutral-500">
                <th className="pb-4 font-medium pl-4">Product Name</th>
                <th className="pb-4 font-medium">Category</th>
                <th className="pb-4 font-medium text-right">Price</th>
                <th className="pb-4 font-medium text-right">Stock</th>
                <th className="pb-4 font-medium pl-8">Status</th>
                <th className="pb-4 font-medium text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockProducts.map((product, idx) => (
                <motion.tr 
                  key={product.id}
                  variants={listItemVariants}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-soft-stone/40 hover:bg-warm-ivory/50 transition-colors group"
                >
                  <td className="py-4 pl-4">
                    <div className="font-semibold text-neutral-900">{product.name}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">{product.unit} • {product.id}</div>
                  </td>
                  <td className="py-4 text-neutral-600 text-sm">{product.category}</td>
                  <td className="py-4 text-right font-medium text-neutral-900">₹{product.price}</td>
                  <td className="py-4 text-right font-medium text-neutral-700">{product.stock}</td>
                  <td className="py-4 pl-8">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      product.status === 'In Stock' ? 'bg-emerald/10 text-emerald' : 
                      product.status === 'Low Stock' ? 'bg-yellow-500/10 text-yellow-700' : 
                      'bg-muted-red/10 text-muted-red'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-4">
                    <button className="p-2 text-neutral-400 hover:text-forest-green hover:bg-sage-green/10 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
}
