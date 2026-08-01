'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Mic, ReceiptText, Users, BotMessageSquare } from 'lucide-react';

const mobileNavItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Bills', href: '/bills', icon: ReceiptText },
  { name: 'Billing', href: '/billing', icon: Mic, isPrimary: true },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'AI', href: '/advisor', icon: BotMessageSquare },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-warm-ivory border-t border-soft-stone/80 z-40 px-6 pb-safe pt-2">
      <div className="flex items-center justify-between h-full max-w-md mx-auto relative">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <div key={item.name} className="relative -top-6">
                <Link href={item.href}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive ? 'bg-forest-green text-warm-ivory shadow-forest-green/30' : 'bg-emerald text-warm-ivory shadow-emerald/30'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </Link>
              </div>
            );
          }

          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-14">
              <div className="relative mb-1">
                {isActive && (
                  <motion.div
                    layoutId="mobile-active-indicator"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-forest-green rounded-full"
                  />
                )}
                <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-forest-green' : 'text-neutral-400'}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-forest-green' : 'text-neutral-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
