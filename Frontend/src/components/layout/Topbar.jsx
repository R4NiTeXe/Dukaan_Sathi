'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Bell, User, Menu, X,
  LayoutDashboard, Mic, ReceiptText, Users as UsersIcon, Package, BarChart, BotMessageSquare
} from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Voice Billing', href: '/billing', icon: Mic },
  { name: 'Bills', href: '/bills', icon: ReceiptText },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Analytics', href: '/analytics', icon: BarChart },
  { name: 'AI Advisor', href: '/advisor', icon: BotMessageSquare },
];

export default function Topbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="h-16 md:h-20 bg-warm-ivory border-b border-soft-stone px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
        
        {/* Hamburger Menu (Mobile Only) */}
        <button 
          className="md:hidden p-2 -ml-2 mr-2 text-neutral-600 hover:bg-soft-stone/50 rounded-xl transition-colors"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex-1 max-w-xl min-w-0 mx-1 md:mx-4">
          <div className="relative group min-w-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400 group-focus-within:text-forest-green transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full min-w-0 pl-10 pr-4 py-2.5 bg-off-white border border-soft-stone rounded-2xl text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sage-green/30 focus:border-sage-green transition-all shadow-[var(--shadow-soft)] hover:shadow-md"
              placeholder="Search bills, customers, or products..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 ml-4 md:ml-6">
          <ThemeToggle />

          <button className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-sage-green/20 border border-sage-green/30 flex items-center justify-center text-forest-green font-medium shadow-sm hover:shadow-md transition-shadow">
            <User className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-over Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40 transition-opacity"
        />
      )}
      
      {/* Mobile Slide-over Drawer */}
      <div className={`md:hidden fixed inset-y-0 left-0 w-[45vw] max-w-[200px] bg-off-white shadow-2xl z-50 flex flex-col pt-6 pb-8 border-r border-soft-stone transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-4 mb-8 flex items-center justify-between">
          <div className="w-9 h-9 rounded-lg bg-forest-green flex items-center justify-center text-warm-ivory font-bold shadow-sm">
            DS
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 -mr-2 text-neutral-500 hover:bg-soft-stone/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.name} href={item.href} className="relative block" onClick={() => setIsMobileMenuOpen(false)}>
                {isActive && (
                  <div className="absolute inset-0 bg-sage-green/10 rounded-xl" />
                )}
                <div className={`relative flex items-center px-4 py-3.5 rounded-xl transition-colors text-sm whitespace-nowrap ${
                  isActive ? 'text-forest-green font-medium' : 'text-neutral-600 hover:text-neutral-900 hover:bg-soft-stone/50'
                }`}>
                  <Icon className="w-5 h-5 mr-3" strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
