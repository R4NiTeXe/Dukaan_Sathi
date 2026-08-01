'use client';

import { Search, Bell, User } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-16 md:h-20 bg-warm-ivory border-b border-soft-stone/50 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-400 group-focus-within:text-forest-green transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2.5 bg-off-white border border-soft-stone rounded-2xl text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sage-green/30 focus:border-sage-green transition-all shadow-[var(--shadow-soft)] hover:shadow-md"
            placeholder="Search bills, customers, or products..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-6">
        <button className="p-2.5 rounded-full hover:bg-soft-stone/80 text-neutral-500 transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-muted-red rounded-full ring-2 ring-warm-ivory"></span>
        </button>
        <button className="w-10 h-10 rounded-full bg-sage-green/20 border border-sage-green/30 flex items-center justify-center text-forest-green font-medium shadow-sm hover:shadow-md transition-shadow">
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
