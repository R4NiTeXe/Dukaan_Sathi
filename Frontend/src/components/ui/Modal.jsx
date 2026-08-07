'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm"
          />

          {/* Modal Container — bottom sheet on phones, centered dialog on larger screens */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-warm-ivory border-soft-stone pointer-events-auto flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-b-none border shadow-[var(--shadow-hover)] sm:rounded-2xl"
            >
              {/* Header */}
              <div className="border-soft-stone bg-off-white/50 flex items-center justify-between border-b px-5 py-4 sm:px-6">
                <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="hover:bg-soft-stone/50 cursor-pointer rounded-full p-2 text-neutral-400 transition-colors hover:text-neutral-900"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto p-5 sm:p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
