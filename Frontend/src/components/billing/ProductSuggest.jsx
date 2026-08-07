'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, IndianRupee } from 'lucide-react';
import api from '@/services/api';

// Debounced product auto-suggest for the Smart Billing input.
// Emits fully-priced item rows via onAddItem, so the cashier never types a
// price for a product that already exists in the shop's catalog.
export default function ProductSuggest({ onAddItem }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const runQuery = useCallback(
    async (rawQuery) => {
      const q = rawQuery.trim();
      if (q.length < 1) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoadingSuggest(true);
      try {
        const { data } = await api.get(`/products/search?q=${encodeURIComponent(q)}&limit=8`);
        setResults(data.data?.results || []);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoadingSuggest(false);
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runQuery(query), 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, runQuery]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const handler = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addItem = (product) => {
    setOpen(false);
    setQuery('');
    const price = Number(product.price) || 0;
    onAddItem({
      productName: product.name,
      quantity: 1,
      unit: product.unit || 'piece',
      price,
      pricePerUnit: false,
      match: 'catalog',
      matchedProductId: product._id,
      catalogUnitPrice: price,
      catalogName: product.name,
      catalogUnit: product.unit || 'piece',
      category: product.category,
      taxRate: product.taxRate,
    });
  };

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder='Search catalog — try "1 kg sugar" or "Maggi"…'
            className="bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green w-full rounded-xl border py-3 pr-4 pl-10 text-sm transition-all focus:ring-1 focus:outline-none"
            aria-label="Search products"
          />
          {loadingSuggest && (
            <div className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-neutral-300 border-t-sage-green" />
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <ul className="bg-warm-ivory border-soft-stone absolute z-30 mt-1 w-full overflow-hidden rounded-xl border shadow-[var(--shadow-hover)]">
          {results.map((product) => (
            <li key={product._id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addItem(product)}
                className="hover:bg-off-white flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-neutral-800">
                    {product.name}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {product.category && product.category !== 'other'
                      ? `${product.category} · `
                      : ''}
                    per {product.unit}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 font-semibold text-neutral-900">
                  <IndianRupee className="h-3 w-3" />
                  {product.price}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}