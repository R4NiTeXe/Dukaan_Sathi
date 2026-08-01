import { Inter } from 'next/font/google';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Dukaan Saathi | AI Billing Platform',
  description: 'AI-powered billing and business operating system for local Indian businesses.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased bg-warm-ivory text-neutral-900 flex`}>
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-64 min-h-screen pb-20 md:pb-0">
          <Topbar />
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
