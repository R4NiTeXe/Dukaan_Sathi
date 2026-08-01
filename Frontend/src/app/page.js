'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listVariants, listItemVariants } from '@/utils/animations';
import { TrendingUp, Users, Receipt, AlertCircle, BotMessageSquare, Loader2 } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

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
        const formattedWeekly = weeklyRes.data.data?.data?.map(item => ({
          name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
          total: item.totalRevenue
        })) || [];

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
          Good morning, {user?.name?.split(' ')[0] || 'Store Owner'}!
        </h1>
        <p className="text-neutral-500 mt-2 text-lg">Here's what's happening at your shop today.</p>
      </header>

      {error && (
        <div className="p-4 bg-muted-red/10 border border-muted-red/20 rounded-2xl flex items-center gap-3 text-muted-red">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <motion.div 
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={listItemVariants} whileHover="hover" className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500">Today's Revenue</h3>
            <div className="p-2 bg-emerald/10 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald" /></div>
          </div>
          <div className="text-3xl md:text-4xl font-bold tracking-tight mb-2">₹{data.summary.todayRevenue?.toLocaleString() || 0}</div>
          <div className="text-sm text-emerald flex items-center font-medium">
            Overview <span className="text-neutral-400 font-normal ml-2">from today</span>
          </div>
        </motion.div>

        <motion.div variants={listItemVariants} whileHover="hover" className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500">Total Bills Generated</h3>
            <div className="p-2 bg-sage-green/10 rounded-xl"><Receipt className="w-5 h-5 text-forest-green" /></div>
          </div>
          <div className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{data.summary.totalBills || 0}</div>
          <div className="text-sm text-neutral-500 flex items-center">
            {data.summary.billsThisWeek || 0} this week
          </div>
        </motion.div>

        <motion.div variants={listItemVariants} whileHover="hover" className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500">Active Customers</h3>
            <div className="p-2 bg-muted-indigo/10 rounded-xl"><Users className="w-5 h-5 text-muted-indigo" /></div>
          </div>
          <div className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{data.summary.topCustomers?.length || 0}</div>
          <div className="text-sm text-emerald flex items-center font-medium">
            Returning <span className="text-neutral-400 font-normal ml-2">customers</span>
          </div>
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
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-hover)' }}
                    itemStyle={{ color: 'var(--color-forest-green)', fontWeight: 600 }}
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
                    cursor={{fill: 'var(--color-warm-ivory)'}}
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
