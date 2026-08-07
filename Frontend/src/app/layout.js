import { Inter, Calistoga } from 'next/font/google';
import AppLayout from '@/components/layout/AppLayout';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const calistoga = Calistoga({ subsets: ['latin'], variable: '--font-calistoga', weight: '400' });

export const metadata = {
  title: 'Dukaan Saathi | AI Billing Platform',
  description: 'AI-powered billing and business operating system for local Indian businesses.',
  openGraph: {
    title: 'Dukaan Saathi | AI Billing Platform',
    description: 'AI-powered billing and business operating system for local Indian businesses.',
    type: 'website',
    locale: 'en_IN',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f6' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${calistoga.variable} bg-warm-ivory flex max-w-[100vw] overflow-x-hidden font-sans text-neutral-900 antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
