'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import { AuthProvider } from '@/context/AuthContext';

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <AuthProvider>
      {isAuthPage ? (
        <main className="w-full max-w-full min-w-0 overflow-x-hidden">{children}</main>
      ) : (
        <>
          <a
            href="#main-content"
            className="focus:bg-forest-green focus:text-warm-ivory sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-xl focus:px-4 focus:py-2 focus:shadow-lg"
          >
            Skip to content
          </a>
          <Sidebar />
          <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-32 md:ml-64 md:pb-0">
            <Topbar />
            <main
              id="main-content"
              className="w-full max-w-full min-w-0 flex-1 overflow-x-hidden p-4 md:p-8"
            >
              {children}
            </main>
          </div>
          <MobileNav />
        </>
      )}
    </AuthProvider>
  );
}
