'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Plus, Minus, IndianRupee, Inbox, RefreshCw } from 'lucide-react';
import api from '@/services/api';
import { timeAgo } from '@/utils/time';
import { listItemVariants } from '@/utils/animations';

// Recent Bills: the cashier's quick-pick list of products from the shop's
// most recent bills. Tapping "+" drops the item into the current bill; the
// stepper adjusts how much to add. Falls back to a graceful empty state.
export default function RecentBills({ onAddProduct, className = '' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const quantitiesRef = useRef({});
  const [, forceRender] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/billing/recent-products?limit=12');
      if (data.success) {
        setProducts(data.data?.products || []);
      }
    } catch {
      setError("Couldn't load recent items. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getQty = (name) => quantitiesRef.current[name] || 1;

  const changeQty = (name, delta) => {
    quantitiesRef.current[name] = Math.max(1, (getQty(name) || 1) + delta);
    forceRender((x) => x + 1);
  };

  const handleAdd = (product) => {
    const qty = getQty(product.productName);
    quantitiesRef.current[product.productName] = 1;
    forceRender((x) => x + 1);
    onAddProduct(product, qty);
  };

  if (loading) {
    return (
      <section
        className={`bg-off-white border-soft-stone rounded-2xl border p-6 shadow-[var(--shadow-soft)] ${className}`}
      >
        <div className="mb-4 flex items-center gap-2">
          <History className="text-forest-green h-5 w-5" />
          <h2 className="text-lg font-bold text-neutral-900">Recent Billed Items</h2>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-soft-stone/40 h-12 animate-pulse rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`bg-off-white border-soft-stone rounded-2xl border p-6 shadow-[var(--shadow-soft)] ${className}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
          <History className="text-forest-green h-5 w-5" /> Recent Billed Items
        </h2>
        <button
          onClick={refresh}
          className="hover:bg-sage-green/10 flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-neutral-500 transition-colors"
          aria-label="Refresh recent items"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="bg-muted-red/10 border-muted-red/20 text-muted-red rounded-lg border p-4 text-sm"
        >
          {error}
        </p>
      )}

      {!error && !loading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center text-neutral-400">
          <Inbox className="mb-3 h-10 w-10 opacity-40" strokeWidth={1.5} />
          <p className="font-medium text-neutral-500">No recent items yet</p>
          <p className="max-w-xs text-sm text-neutral-400">
            Bill a few products with the mic above and they&apos;ll be one tap away here.
          </p>
        </div>
      )}

      {products.length > 0 && (
        <ul className="divide-soft-stone divide-y">
          {products.map((product, idx) => {
            const qty = getQty(product.productName);
            return (
              <motion.li
                key={`${product.productName}-${idx}`}
                variants={listItemVariants}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-800">{product.productName}</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-0.5 font-semibold text-neutral-700">
                      <IndianRupee className="h-3 w-3" />
                      {product.unitPrice}
                    </span>
                    <span className="text-neutral-400"> / {product.unit} ·</span> billed{' '}
                    {timeAgo(product.lastBilledAt)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Quantity stepper */}
                  <div className="bg-warm-ivory border-soft-stone flex items-center gap-1 rounded-xl border p-1">
                    <button
                      type="button"
                      onClick={() => changeQty(product.productName, -1)}
                      disabled={qty <= 1}
                      className="hover:bg-soft-stone/70 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-neutral-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Decrease quantity of ${product.productName}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-neutral-800">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQty(product.productName, 1)}
                      className="hover:bg-soft-stone/70 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-neutral-600 transition-colors"
                      aria-label={`Increase quantity of ${product.productName}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Quick add */}
                  <button
                    type="button"
                    onClick={() => handleAdd(product)}
                    className="bg-emerald text-warm-ivory hover:bg-emerald/90 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl shadow-sm transition-colors"
                    aria-label={`Add ${product.productName} to bill`}
                    title="Add to bill"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}