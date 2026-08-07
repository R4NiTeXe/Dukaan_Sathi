'use client';

import Modal from '@/components/ui/Modal';
import { Sparkles, Loader2 } from 'lucide-react';

// After a bill is saved, if the cashier changed the price of catalog items,
// ask whether those new prices should become the new default price.
export default function PriceUpdateModal({ open, changes, onClose, onUpdatePrices, updating }) {
  if (!open || changes.length === 0) return null;

  return (
    <Modal
      isOpen={open}
      onClose={updating ? () => {} : onClose}
      title="Update default price?"
    >
      <p className="mb-4 text-sm text-neutral-500">
        These items were billed at a different price than their saved default
        price. Update the catalog so the next time it auto-fills the new price?
      </p>

      <ul className="mb-6 space-y-2">
        {changes.map((change) => (
          <li
            key={change.productId}
            className="bg-off-white border-soft-stone flex items-center justify-between rounded-xl border px-4 py-3"
          >
            <div>
              <p className="font-medium text-neutral-800">{change.name}</p>
              <p className="text-xs text-neutral-400">
                Default ₹{change.oldPrice} → ₹{change.newPrice} / {change.unit}
              </p>
            </div>
            <Sparkles className="text-sage-green h-4 w-4" />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onUpdatePrices}
          disabled={updating}
          className="bg-forest-green text-warm-ivory flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-60"
        >
          {updating && <Loader2 className="h-4 w-4 animate-spin" />}
          Update default price
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={updating}
          className="border-soft-stone bg-warm-ivory hover:bg-soft-stone/50 flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors disabled:opacity-60"
        >
          Keep this bill only
        </button>
      </div>
    </Modal>
  );
}