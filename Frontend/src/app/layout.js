import { Inter } from "next/font/google";
import AppLayout from "@/components/layout/AppLayout";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Dukaan Saathi | AI Billing Platform",
  description:
    "AI-powered billing and business operating system for local Indian businesses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans antialiased bg-warm-ivory text-neutral-900 flex overflow-x-hidden max-w-[100vw]`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppLayout>
            {children}
          </AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
