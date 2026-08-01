'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { Search, Plus, Edit2, AlertCircle, Loader2 } from 'lucide-react';
import AddProductModal from '@/components/modals/AddProductModal';
import api from '@/services/api';

export default function ProductsList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, lowStock: 0, value: 0 });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Fetching up to 50 products initially, search term applied
      const url = `/products?limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const response = await api.get(url);
      
      const fetchedProducts = response.data.data.products || [];
      setProducts(fetchedProducts);

      // Compute stats
      const total = response.data.data.pagination?.total || 0;
      const lowStock = fetchedProducts.filter(p => p.stock > 0 && p.stock <= 10).length; // Example low stock threshold
      const value = fetchedProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
      
      setStats({ total, lowStock, value });
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const getStatus = (stock) => {
    if (stock <= 0) return { label: 'Out of Stock', classes: 'bg-muted-red/10 text-muted-red' };
    if (stock <= 10) return { label: 'Low Stock', classes: 'bg-yellow-500/10 text-yellow-700' };
    return { label: 'In Stock', classes: 'bg-emerald/10 text-emerald' };
  };

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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">Products Inventory</h1>
          <p className="text-neutral-500 mt-1">Manage your store&apos;s items and stock levels.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-forest-green text-warm-ivory rounded-xl font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </header>

      {error && (
        <div className="p-4 bg-muted-red/10 border border-muted-red/20 rounded-2xl flex items-center gap-3 text-muted-red">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone">
          <h3 className="text-sm font-medium text-neutral-500 mb-1">Total Products</h3>
          <div className="text-3xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone">
          <h3 className="text-sm font-medium text-neutral-500 mb-1">Low Stock Items</h3>
          <div className="text-3xl font-bold text-muted-red flex items-center gap-2">
            {stats.lowStock} {stats.lowStock > 0 && <AlertCircle className="w-5 h-5" />}
          </div>
        </div>
        <div className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone">
          <h3 className="text-sm font-medium text-neutral-500 mb-1">Total Inventory Value</h3>
          <div className="text-3xl font-bold text-forest-green">₹{stats.value.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-off-white rounded-[24px] p-4 md:p-6 shadow-[var(--shadow-soft)] border border-soft-stone min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-forest-green" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-soft-stone text-sm text-neutral-600">
                  <th className="pb-4 font-medium pl-4">Product Name</th>
                  <th className="pb-4 font-medium">Category</th>
                  <th className="pb-4 font-medium text-right">Price</th>
                  <th className="pb-4 font-medium text-right">Stock</th>
                  <th className="pb-4 font-medium pl-8">Status</th>
                  <th className="pb-4 font-medium text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-neutral-500">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product, idx) => {
                    const status = getStatus(product.stock);
                    return (
                      <motion.tr 
                        key={product._id}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="show"
                        transition={{ delay: idx * 0.05 }}
                        className="border-b border-soft-stone hover:bg-warm-ivory/50 transition-colors group"
                      >
                        <td className="py-4 pl-4">
                          <div className="font-semibold text-neutral-900">{product.name}</div>
                          <div className="text-xs text-neutral-400 mt-0.5">{product.unit}</div>
                        </td>
                        <td className="py-4 text-neutral-600 text-sm">{product.category}</td>
                        <td className="py-4 text-right font-medium text-neutral-900">₹{product.price}</td>
                        <td className="py-4 text-right font-medium text-neutral-700">{product.stock}</td>
                        <td className="py-4 pl-8">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.classes}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-4 text-right pr-4">
                          <button className="p-2 text-neutral-500 hover:text-forest-green hover:bg-sage-green/10 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onProductAdded={fetchProducts}
      />
    </motion.div>
  );
}
