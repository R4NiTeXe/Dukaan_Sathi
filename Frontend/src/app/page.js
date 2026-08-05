'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listVariants, listItemVariants } from '@/utils/animations';
import { Receipt, AlertCircle, BotMessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { LANGUAGES } from '@/constants/navigation';
import { SkeletonLine, SkeletonCard } from '@/components/ui/Skeleton';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
};

const SLOGANS = {
  en: 'Smart billing, in your own language',
  hi: 'अपनी भाषा में स्मार्ट बिलिंग',
  bn: 'আপনার ভাষায় স্মার্ট বিলিং',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    summary: {
      todayRevenue: 0,
      totalBills: 0,
      billsThisWeek: 0,
    },
    weekly: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, weeklyRes, topRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/analytics/weekly'),
          api.get('/analytics/top-products'),
        ]);

        // Format weekly data for chart
        const rawWeekly = weeklyRes.data.data?.data || [];

        // Pad with missing days to always show 7 days (fixes the "no line" issue for single-day data)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d;
        });

        const formattedWeekly = last7Days.map((dateObj) => {
          // Create local YYYY-MM-DD string
          const dateStr = [
            dateObj.getFullYear(),
            String(dateObj.getMonth() + 1).padStart(2, '0'),
            String(dateObj.getDate()).padStart(2, '0'),
          ].join('-');

          const existing = rawWeekly.find((item) => item.date === dateStr);
          return {
            name: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
            total: existing ? existing.totalRevenue : 0,
          };
        });

        // Format top products
        const formattedTopProducts =
          topRes.data.data?.data?.map((item) => ({
            name: item.productName,
            sales: item.totalRevenue,
          })) || [];

        setData({
          summary: summaryRes.data.data || { todayRevenue: 0, totalBills: 0, billsThisWeek: 0 },
          weekly: formattedWeekly,
          topProducts: formattedTopProducts,
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl min-w-0 space-y-8">
        <div className="mb-6 space-y-3 md:mb-10">
          <SkeletonLine className="h-8 w-1/3" />
          <SkeletonLine className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SkeletonCard className="min-h-[220px]" />
          <SkeletonCard className="min-h-[220px]" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SkeletonCard className="min-h-[320px] lg:col-span-2" />
          <SkeletonCard className="min-h-[320px]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto max-w-7xl min-w-0 space-y-8"
    >
      <header className="mb-6 md:mb-10">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
          {getGreeting()}, {user?.ownerName?.split(' ')[0] || 'Store Owner'}!
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="bg-sage-green h-px w-8" aria-hidden="true" />
          <p className="text-sm text-neutral-500 md:text-base">
            {SLOGANS[user?.preferredLanguage] || SLOGANS.en}
          </p>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="bg-muted-red/10 border-muted-red/20 text-muted-red flex items-center gap-3 rounded-2xl border p-4"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {/* Cool Action Banners */}
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        {/* AI Action */}
        <motion.div
          variants={listItemVariants}
          className="from-forest-green to-sage-green text-warm-ivory relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-lg md:p-8"
        >
          <div className="absolute -top-4 -right-4 rotate-12 transform opacity-10">
            <BotMessageSquare className="h-40 w-40" />
          </div>
          <div className="relative z-10">
            <h2 className="mb-2 text-2xl font-bold">Need Business Advice?</h2>
            <p className="text-warm-ivory/80 max-w-[85%] text-sm md:text-base">
              Your AI advisor is ready to analyze your latest shop data and give you personalized
              recommendations.
            </p>
          </div>
          <Link
            href="/advisor"
            className="bg-warm-ivory text-forest-green relative z-10 mt-6 w-max cursor-pointer rounded-xl px-6 py-3 text-sm font-bold shadow-md transition-all hover:shadow-xl"
          >
            Chat with AI
          </Link>
        </motion.div>

        {/* Voice Billing Action */}
        <motion.div
          variants={listItemVariants}
          className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 text-white shadow-lg md:p-8"
        >
          <div className="absolute -right-8 -bottom-8 -rotate-12 transform opacity-10">
            <Receipt className="h-48 w-48" />
          </div>
          <div className="relative z-10">
            <h2 className="mb-2 text-2xl font-bold">Generate a New Bill</h2>
            <p className="max-w-[85%] text-sm text-white/70 md:text-base">
              Use our advanced Voice AI feature to quickly extract items, quantities, and prices
              from speech.
            </p>
          </div>
          <Link
            href="/billing"
            className="relative z-10 mt-6 w-max cursor-pointer rounded-xl border border-[#2dd4bf]/30 bg-[#2dd4bf]/20 px-6 py-3 text-sm font-bold text-[#2dd4bf] shadow-md transition-all hover:bg-[#2dd4bf]/30"
          >
            Start Voice Billing
          </Link>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          variants={listItemVariants}
          className="bg-off-white border-soft-stone rounded-2xl border p-6 shadow-[var(--shadow-soft)] lg:col-span-2"
        >
          <h3 className="mb-6 text-lg font-semibold">Revenue Trend (Last 7 Days)</h3>
          <div className="h-72 w-full">
            {data.weekly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weekly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-sage-green)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="var(--color-sage-green)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-soft-stone)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-neutral-600)', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-neutral-600)', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: 'var(--color-off-white)',
                      borderRadius: '16px',
                      border: '1px solid var(--color-soft-stone)',
                      boxShadow: 'var(--shadow-hover)',
                    }}
                    itemStyle={{ color: 'var(--color-forest-green)', fontWeight: 600 }}
                    labelStyle={{ color: 'var(--color-neutral-900)', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-forest-green)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400">
                No revenue data yet
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={listItemVariants}
          className="bg-off-white border-soft-stone rounded-2xl border p-6 shadow-[var(--shadow-soft)]"
        >
          <h3 className="mb-6 text-lg font-semibold">Top Selling Items</h3>
          <div className="h-72 w-full">
            {data.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.topProducts}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--color-soft-stone)"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-neutral-600)', fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: 'var(--shadow-soft)',
                    }}
                  />
                  <Bar dataKey="sales" radius={[0, 8, 8, 0]} barSize={24}>
                    {data.topProducts.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? 'var(--color-forest-green)' : 'var(--color-sage-green)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-neutral-400">
                No products sold yet. Create a bill!
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
