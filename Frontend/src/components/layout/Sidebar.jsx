'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { navItems } from '@/constants/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 h-screen bg-off-white border-r border-soft-stone fixed left-0 top-0 flex-col pt-6 pb-8">
      <div className="px-6 mb-10">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-forest-green flex items-center justify-center text-warm-ivory">
            DS
          </div>
          Dukaan Saathi
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className="relative block">
              {isActive && (
                <motion.div
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-sage-green/10 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <div className={`relative flex items-center px-4 py-3 rounded-xl transition-colors ${
                isActive ? 'text-forest-green font-medium' : 'text-neutral-500 hover:text-neutral-900 hover:bg-soft-stone/50'
              }`}>
                <Icon className="w-5 h-5 mr-3" strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
