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
          <Sidebar />
          <div className="flex-1 flex flex-col md:ml-64 min-h-screen pb-32 md:pb-0 min-w-0">
            <Topbar />
            <main className="flex-1 p-4 md:p-8 min-w-0 w-full max-w-full overflow-x-hidden">
              {children}
            </main>
          </div>
          <MobileNav />
        </>
      )}
    </AuthProvider>
  );
}
