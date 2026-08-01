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
          className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <Link 
            href="/billing"
            className="flex items-center justify-center w-16 h-16 bg-forest-green text-warm-ivory rounded-full shadow-[var(--shadow-hover)] border-4 border-warm-ivory hover:scale-105 active:scale-95 transition-transform"
          >
            <Mic className="w-7 h-7" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
