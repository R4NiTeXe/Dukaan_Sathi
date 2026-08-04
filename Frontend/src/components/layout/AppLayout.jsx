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
        <main className="min-w-0 w-full max-w-full overflow-x-hidden">{children}</main>
      ) : (
        <>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-forest-green focus:text-warm-ivory focus:rounded-xl focus:shadow-lg"
          >
            Skip to content
          </a>
          <Sidebar />
          <div className="flex-1 flex flex-col md:ml-64 min-h-screen pb-32 md:pb-0 min-w-0">
            <Topbar />
            <main id="main-content" className="flex-1 p-4 md:p-8 min-w-0 w-full max-w-full overflow-x-hidden">
              {children}
            </main>
          </div>
          <MobileNav />
        </>
      )}
    </AuthProvider>
  );
}
