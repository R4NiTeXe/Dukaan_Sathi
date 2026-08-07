'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import {
  Search,
  AlertCircle,
  Loader2,
  PackageOpen,
  TrendingDown,
  Sparkles,
  Plus,
} from 'lucide-react';
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
      className="mx-auto max-w-6xl min-w-0 space-y-8"
    >
      <PageHeader
        title="Products Catalog"
        description="Manage your store's items."
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        }
      />

      {/* Cool Inventory Health Banner */}
      {!loading && products.length > 0 && (
        <motion.div
          variants={listItemVariants}
          className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-slate-800 to-neutral-900 p-6 text-white shadow-lg sm:flex-row"
        >
          <div className="absolute top-0 right-1/4 scale-150 rotate-45 transform opacity-[0.03]">
            <PackageOpen className="h-64 w-64" />
          </div>

          <div className="relative z-10 flex-1">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-bold">
              <TrendingDown className="h-5 w-5 text-yellow-400" />
              Inventory Health
            </h2>
            <p className="text-sm text-white/70">Keep an eye on items that are running low.</p>
          </div>

          <div className="relative z-10 flex w-full gap-4 sm:w-auto sm:gap-8">
            <div className="flex-1 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-md sm:w-32">
              <div className="text-3xl font-bold text-yellow-400">
                {products.filter((p) => p.stock > 0 && p.stock <= 10).length}
              </div>
              <div className="mt-1 text-xs font-semibold tracking-wider text-white/80 uppercase">
                Low Stock
              </div>
            </div>
            <div className="flex-1 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-md sm:w-32">
              <div className="text-3xl font-bold text-red-400">
                {products.filter((p) => p.stock <= 0).length}
              </div>
              <div className="mt-1 text-xs font-semibold tracking-wider text-white/80 uppercase">
                Out of Stock
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <p className="-mt-4 flex items-center gap-1.5 text-xs text-neutral-400">
        <Sparkles className="text-sage-green h-3.5 w-3.5" />
        New items get learned instantly when you confirm their price during Smart Billing; items
        sold 15× in a month are auto-added too.
      </p>

      {error && (
        <div
          role="alert"
          className="bg-muted-red/10 border-muted-red/20 text-muted-red flex items-center gap-3 rounded-2xl border p-4"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-off-white border-soft-stone min-w-0 rounded-2xl border p-4 shadow-[var(--shadow-soft)] md:p-6">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name..."
              className="bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green/20 w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm shadow-sm transition-all focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <SkeletonLine className="h-4 w-1/3" />
                  <SkeletonLine className="ml-auto h-4 w-1/6" />
                  <SkeletonLine className="h-4 w-1/6" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-soft-stone border-b text-sm text-neutral-600">
                  <th className="pb-4 pl-4 font-medium">Product Name</th>
                  <th className="pb-4 text-right font-medium">Price</th>
                  <th className="pb-4 text-right font-medium">Sold (30d)</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center">
                      <EmptyState
                        title="No products found"
                        description={
                          search
                            ? 'Try a different search term.'
                            : 'Add your first product to get started.'
                        }
                        action={
                          !search && (
                            <Button onClick={() => setIsAddOpen(true)} size="sm">
                              <Plus className="h-4 w-4" /> Add Product
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
                        className="border-soft-stone hover:bg-warm-ivory/50 group border-b transition-colors"
                      >
                        <td className="py-4 pl-4">
                          <div className="flex items-center gap-2 font-semibold text-neutral-900">
                            {product.name}
                            {product.autoAdded && (
                              <span
                                title="Automatically added based on sales frequency (sold more than 15 times)"
                                className="bg-sage-green/10 text-sage-green border-sage-green/20 inline-flex cursor-help items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                Auto-added
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-neutral-400">
                            {product.unit}
                            {product.category && product.category !== 'other' && (
                              <span className="bg-sage-green/10 text-sage-green rounded-full border border-transparent px-1.5 py-px text-[10px]">
                                {product.category}
                              </span>
                            )}
                            {product.taxRate > 0 && <span>GST {product.taxRate}%</span>}
                          </div>
                        </td>
                        <td className="py-4 text-right font-medium text-neutral-900">
                          ₹{product.price}
                        </td>
                        <td className="py-4 text-right font-medium text-neutral-700">
                          {product.monthlySold}×
                        </td>
                      </motion.tr>
                    );
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
