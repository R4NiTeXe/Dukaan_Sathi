'use client';

import Modal from '@/components/ui/Modal';
import { HelpCircle } from 'lucide-react';

// When an extracted item matches more than one catalog product with the same
// name, ask the cashier which one they meant — or treat it as a brand-new item.
export default function AmbiguousProductModal({ item, onPick, onClose }) {
  if (!item) return null;

  return (
    <Modal isOpen={Boolean(item)} onClose={onClose} title="Which product do you mean?">
      <p className="mb-2 text-sm text-neutral-500">
        You said <span className="font-semibold text-neutral-800">“{item.productName}”</span>,
        which matches several saved products:
      </p>

      <ul className="mb-6 space-y-2">
        {(item.candidates || []).map((candidate) => (
          <li key={candidate._id}>
            <button
              type="button"
              onClick={() => onPick(candidate, false)}
              className="hover:bg-off-white border-soft-stone flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors"
            >
              <div>
                <p className="font-medium text-neutral-800">{candidate.name}</p>
                <p className="text-xs text-neutral-400">
                  ₹{candidate.price} / {candidate.unit}
                </p>
              </div>
              <HelpCircle className="text-forest-green h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onPick(null, true)}
        className="border-soft-stone hover:bg-soft-stone/50 w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors"
      >
        None of these — add as a new product
      </button>
    </Modal>
  );
}