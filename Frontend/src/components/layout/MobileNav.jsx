'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  // Hide the floating voice button if we're already on the billing page
  const isBillingPage = pathname === '/billing';

  return (
    <AnimatePresence>
      {!isBillingPage && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 md:hidden"
        >
          <Link
            href="/billing"
            className="bg-forest-green text-warm-ivory border-warm-ivory flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-[var(--shadow-hover)] transition-transform hover:scale-105 active:scale-95"
            aria-label="Go to voice billing"
          >
            <Mic className="h-7 w-7" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
