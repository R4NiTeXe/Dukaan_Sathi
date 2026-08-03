'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listVariants, listItemVariants } from '@/utils/animations';
import { Receipt, AlertCircle, BotMessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

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

        const formattedWeekly = last7Days.map(dateObj => {
          // Create local YYYY-MM-DD string
          const dateStr = [
            dateObj.getFullYear(),
            String(dateObj.getMonth() + 1).padStart(2, '0'),
            String(dateObj.getDate()).padStart(2, '0')
          ].join('-');
          
          const existing = rawWeekly.find(item => item.date === dateStr);
          return {
            name: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
            total: existing ? existing.totalRevenue : 0
          };
        });

        // Format top products
        const formattedTopProducts = topRes.data.data?.data?.map(item => ({
          name: item.productName,
          sales: item.totalRevenue
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
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-green" />
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto space-y-8 min-w-0"
    >
      <header className="mb-6 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">
          {getGreeting()}, {user?.ownerName?.split(' ')[0] || 'Store Owner'}!
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="h-px w-8 bg-sage-green" aria-hidden="true" />
          <p className="text-neutral-500 text-sm md:text-base">
            {SLOGANS[user?.preferredLanguage] || SLOGANS.en}
          </p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-muted-red/10 border border-muted-red/20 rounded-2xl flex items-center gap-3 text-muted-red">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {/* Cool Action Banners */}
      <motion.div variants={listVariants} initial="hidden" animate="show" className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Action */}
        <motion.div variants={listItemVariants} className="bg-gradient-to-br from-forest-green to-sage-green rounded-[24px] p-6 md:p-8 text-warm-ivory shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute -top-4 -right-4 opacity-10 transform rotate-12">
            <BotMessageSquare className="w-40 h-40" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Need Business Advice?</h2>
            <p className="text-warm-ivory/80 max-w-[85%] text-sm md:text-base">Your AI advisor is ready to analyze your latest shop data and give you personalized recommendations.</p>
          </div>
          <Link href="/advisor" className="relative z-10 mt-6 bg-warm-ivory text-forest-green text-sm font-bold px-6 py-3 rounded-xl w-max shadow-md hover:shadow-xl hover:scale-105 transition-all">
            Chat with AI
          </Link>
        </motion.div>

        {/* Voice Billing Action */}
        <motion.div variants={listItemVariants} className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[24px] p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute -bottom-8 -right-8 opacity-10 transform -rotate-12">
            <Receipt className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Generate a New Bill</h2>
            <p className="text-white/70 max-w-[85%] text-sm md:text-base">Use our advanced Voice AI feature to quickly extract items, quantities, and prices from speech.</p>
          </div>
          <Link href="/billing" className="relative z-10 mt-6 bg-[#2dd4bf]/20 border border-[#2dd4bf]/30 text-[#2dd4bf] text-sm font-bold px-6 py-3 rounded-xl w-max shadow-md hover:bg-[#2dd4bf]/30 hover:scale-105 transition-all">
            Start Voice Billing
          </Link>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={listItemVariants} className="lg:col-span-2 bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone">
          <h3 className="text-lg font-semibold mb-6">Revenue Trend (Last 7 Days)</h3>
          <div className="h-72 w-full">
            {data.weekly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weekly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-sage-green)" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="var(--color-sage-green)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-soft-stone)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-neutral-600)', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-neutral-600)', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-hover)' }}
                    itemStyle={{ color: 'var(--color-forest-green)', fontWeight: 600 }}
                    labelStyle={{ color: 'var(--color-neutral-800)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--color-forest-green)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400">No revenue data yet</div>
            )}
          </div>
        </motion.div>

        <motion.div variants={listItemVariants} className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone">
          <h3 className="text-lg font-semibold mb-6">Top Selling Items</h3>
          <div className="h-72 w-full">
            {data.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topProducts} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-soft-stone)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'var(--color-neutral-600)', fontSize: 12}} width={120} />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-soft)' }}
                  />
                  <Bar dataKey="sales" radius={[0, 8, 8, 0]} barSize={24}>
                    {data.topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-forest-green)' : 'var(--color-sage-green)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400 text-center">No products sold yet. Create a bill!</div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
