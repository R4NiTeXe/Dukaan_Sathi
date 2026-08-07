'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, LogOut, Settings, UserRound, PencilLine, ChevronDown } from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { navItems } from '@/constants/navigation';

export default function Topbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#profile-menu-container')) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileOpen]);

  return (
    <>
      <header className="bg-warm-ivory border-soft-stone sticky top-0 z-20 flex h-16 items-center justify-between border-b px-4 md:h-20 md:px-8">
        {/* Hamburger Menu (Mobile Only) */}
        <button
          className="hover:bg-soft-stone/50 mr-2 -ml-2 cursor-pointer rounded-xl p-2 text-neutral-600 transition-colors md:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="mx-1 max-w-xl min-w-0 flex-1 md:mx-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                setSearchQuery('');
              }
            }}
            className="group relative min-w-0"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="group-focus-within:text-forest-green h-4 w-4 text-neutral-400 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-off-white border-soft-stone focus:ring-sage-green/30 focus:border-sage-green block w-full min-w-0 cursor-text rounded-2xl border py-2.5 pr-4 pl-10 text-sm placeholder-neutral-400 shadow-[var(--shadow-soft)] transition-all hover:shadow-md focus:ring-2 focus:outline-none"
              placeholder="Search products..."
            />
          </form>
        </div>

        <div className="ml-4 flex items-center gap-2 md:ml-6 md:gap-4">
          <ThemeToggle />

          <div id="profile-menu-container" className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="group flex cursor-pointer items-center gap-2 rounded-full transition-shadow focus:outline-none"
              aria-label="User menu"
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
            >
              <Avatar
                src={user?.avatar}
                name={user?.ownerName}
                size="md"
                className="border-sage-green/30 border-2 transition-transform group-hover:scale-105"
              />
              <ChevronDown
                className={`hidden text-neutral-400 transition-transform sm:block ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
                size={16}
              />
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="bg-warm-ivory border-soft-stone absolute right-0 z-50 mt-3 w-60 overflow-hidden rounded-2xl border py-2 shadow-[var(--shadow-medium)]"
                >
                  <div className="border-soft-stone bg-off-white/50 mb-1 flex items-center gap-3 border-b px-4 py-3">
                    <Avatar src={user?.avatar} name={user?.ownerName} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {user?.ownerName || 'Shop Owner'}
                      </p>
                      <p className="truncate text-xs text-neutral-500">{user?.email}</p>
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex w-full items-center px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-soft-stone/50 hover:text-neutral-900"
                  >
                    <UserRound className="mr-3 h-4 w-4 text-neutral-400" />
                    My Profile
                  </Link>
                  <Link
                    href="/profile?edit=1"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex w-full items-center px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-soft-stone/50 hover:text-neutral-900"
                  >
                    <PencilLine className="mr-3 h-4 w-4 text-neutral-400" />
                    Edit Profile
                  </Link>
                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex w-full items-center px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-soft-stone/50 hover:text-neutral-900"
                  >
                    <Settings className="mr-3 h-4 w-4 text-neutral-400" />
                    Settings
                  </Link>

                  <div className="border-soft-stone/50 my-1 border-t" />

                  <button
                    role="menuitem"
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="text-muted-red flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-red-50/50"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Slide-over Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm transition-opacity md:hidden"
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`bg-off-white border-soft-stone fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r pt-6 pb-8 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-8 flex items-center justify-between px-4">
          <div className="bg-forest-green text-warm-ivory flex h-9 w-9 items-center justify-center rounded-lg font-bold shadow-sm">
            DS
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="hover:bg-soft-stone/50 -mr-2 cursor-pointer rounded-full p-2 text-neutral-500 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative block"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {isActive && <div className="bg-sage-green/10 absolute inset-0 rounded-xl" />}
                <div
                  className={`relative flex items-center rounded-xl px-4 py-3.5 text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-forest-green font-medium'
                      : 'hover:bg-soft-stone/50 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
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
