'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { navItems } from '@/constants/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-off-white border-soft-stone fixed top-0 left-0 hidden h-screen w-64 flex-col border-r pt-6 pb-8 md:flex">
      <div className="mb-10 px-6">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-900">
          <div className="bg-forest-green text-warm-ivory flex h-8 w-8 items-center justify-center rounded-lg">
            DS
          </div>
          Dukaan Saathi
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className="relative block cursor-pointer">
              {isActive && (
                <motion.div
                  layoutId="active-nav-bg"
                  className="bg-sage-green/10 absolute inset-0 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <div
                className={`relative flex items-center rounded-xl px-4 py-3 transition-colors ${
                  isActive
                    ? 'text-forest-green font-medium'
                    : 'hover:bg-soft-stone/50 text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
