'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { Search, AlertCircle, Loader2, PackageOpen, TrendingDown, Sparkles, Plus } from 'lucide-react';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import AddProductModal from '@/components/modals/AddProductModal';
import { SkeletonLine } from '@/components/ui/Skeleton';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Fetching up to 50 products initially, search term applied
      const url = `/products?limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const response = await api.get(url);
      
      const fetchedProducts = response.data.data.products || [];
      setProducts(fetchedProducts);
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
    // Kept empty since status column is removed
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-6xl mx-auto space-y-8 min-w-0"
    >
      <PageHeader
        title="Products Catalog"
        description="Manage your store's items."
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        }
      />

      {/* Cool Inventory Health Banner */}
      {!loading && products.length > 0 && (
        <motion.div variants={listItemVariants} className="bg-gradient-to-r from-neutral-900 via-[#1e293b] to-neutral-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-1/4 opacity-[0.03] transform rotate-45 scale-150">
            <PackageOpen className="w-64 h-64" />
          </div>
          
          <div className="relative z-10 flex-1">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-yellow-400" />
              Inventory Health
            </h2>
            <p className="text-white/70 text-sm">Keep an eye on items that are running low.</p>
          </div>
          
          <div className="relative z-10 flex gap-4 sm:gap-8 w-full sm:w-auto">
            <div className="bg-white/10 rounded-xl p-4 flex-1 sm:w-32 backdrop-blur-md border border-white/10">
              <div className="text-3xl font-bold text-yellow-400">{products.filter(p => p.stock > 0 && p.stock <= 10).length}</div>
              <div className="text-xs text-white/80 mt-1 uppercase tracking-wider font-semibold">Low Stock</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 flex-1 sm:w-32 backdrop-blur-md border border-white/10">
              <div className="text-3xl font-bold text-red-400">{products.filter(p => p.stock <= 0).length}</div>
              <div className="text-xs text-white/80 mt-1 uppercase tracking-wider font-semibold">Out of Stock</div>
            </div>
          </div>
        </motion.div>
      )}

      <p className="text-xs text-neutral-400 flex items-center gap-1.5 -mt-4">
        <Sparkles className="w-3.5 h-3.5 text-sage-green" />
        Items sold more than 15 times in a month are auto-added to your inventory.
      </p>

      {error && (
        <div role="alert" className="p-4 bg-muted-red/10 border border-muted-red/20 rounded-2xl flex items-center gap-3 text-muted-red">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-off-white rounded-2xl p-4 md:p-6 shadow-[var(--shadow-soft)] border border-soft-stone min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name..."
              className="w-full pl-10 pr-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-2 focus:ring-sage-green/20 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <SkeletonLine className="h-4 w-1/3" />
                  <SkeletonLine className="h-4 w-1/6 ml-auto" />
                  <SkeletonLine className="h-4 w-1/6" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-soft-stone text-sm text-neutral-600">
                  <th className="pb-4 font-medium pl-4">Product Name</th>
                  <th className="pb-4 font-medium text-right">Price</th>
                  <th className="pb-4 font-medium text-right">Sold (30d)</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-8">
                      <EmptyState
                        title="No products found"
                        description={search ? "Try a different search term." : "Add your first product to get started."}
                        action={
                          !search && (
                            <Button onClick={() => setIsAddOpen(true)} size="sm">
                              <Plus className="w-4 h-4" /> Add Product
                            </Button>
                          )
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  products.map((product, idx) => {
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
                          <div className="font-semibold text-neutral-900 flex items-center gap-2">
                            {product.name}
                            {product.autoAdded && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sage-green/10 text-sage-green border border-sage-green/20">
                                <Sparkles className="w-2.5 h-2.5" />
                                Auto-added
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-400 mt-0.5">{product.unit}</div>
                        </td>
                        <td className="py-4 text-right font-medium text-neutral-900">₹{product.price}</td>
                        <td className="py-4 text-right font-medium text-neutral-700">{product.monthlySold}×</td>
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
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onProductAdded={fetchProducts}
      />
    </motion.div>
  );
}
