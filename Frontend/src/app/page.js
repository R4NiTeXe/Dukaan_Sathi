'use client';

import { motion } from 'framer-motion';
import { pageVariants, cardHover, listVariants, listItemVariants } from '@/utils/animations';
import { TrendingUp, Users, Receipt, AlertCircle, BotMessageSquare } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const revenueData = [
  { name: 'Mon', total: 4000 },
  { name: 'Tue', total: 3000 },
  { name: 'Wed', total: 5000 },
  { name: 'Thu', total: 2780 },
  { name: 'Fri', total: 6890 },
  { name: 'Sat', total: 8390 },
  { name: 'Sun', total: 10490 },
];

const topProducts = [
  { name: 'Aashirvaad Atta 5kg', sales: 400 },
  { name: 'Fortune Oil 1L', sales: 300 },
  { name: 'Tata Salt 1kg', sales: 200 },
  { name: 'Maggi 4-pack', sales: 278 },
];

export default function Dashboard() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto space-y-8"
    >
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Good morning, Store Owner!</h1>
        <p className="text-neutral-500 mt-2 text-lg">Here's what's happening at your shop today.</p>
      </header>

      {/* KPI Cards */}
      <motion.div 
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={listItemVariants} whileHover="hover" className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500">Today's Revenue</h3>
            <div className="p-2 bg-emerald/10 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald" /></div>
          </div>
          <div className="text-4xl font-bold tracking-tight mb-2">₹10,490</div>
          <div className="text-sm text-emerald flex items-center font-medium">
            +14% <span className="text-neutral-400 font-normal ml-2">from yesterday</span>
          </div>
        </motion.div>

        <motion.div variants={listItemVariants} whileHover="hover" className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500">Bills Generated</h3>
            <div className="p-2 bg-sage-green/10 rounded-xl"><Receipt className="w-5 h-5 text-forest-green" /></div>
          </div>
          <div className="text-4xl font-bold tracking-tight mb-2">42</div>
          <div className="text-sm text-neutral-500 flex items-center">
            2 pending payments
          </div>
        </motion.div>

        <motion.div variants={listItemVariants} whileHover="hover" className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-500">Active Customers</h3>
            <div className="p-2 bg-muted-indigo/10 rounded-xl"><Users className="w-5 h-5 text-muted-indigo" /></div>
          </div>
          <div className="text-4xl font-bold tracking-tight mb-2">124</div>
          <div className="text-sm text-emerald flex items-center font-medium">
            +3 <span className="text-neutral-400 font-normal ml-2">new this week</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={listItemVariants} className="lg:col-span-2 bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
          <h3 className="text-lg font-semibold mb-6">Revenue Trend</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-sage-green)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-sage-green)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-soft-stone)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-hover)' }}
                  itemStyle={{ color: 'var(--color-forest-green)', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="total" stroke="var(--color-forest-green)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={listItemVariants} className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
          <h3 className="text-lg font-semibold mb-6">Top Selling Items</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-soft-stone)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#555', fontSize: 12}} width={120} />
                <Tooltip 
                  cursor={{fill: 'var(--color-warm-ivory)'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-soft)' }}
                />
                <Bar dataKey="sales" radius={[0, 8, 8, 0]} barSize={24}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-forest-green)' : 'var(--color-sage-green)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* AI Insights Widget */}
      <motion.div variants={listItemVariants} className="bg-gradient-to-r from-forest-green to-sage-green rounded-3xl p-6 shadow-[var(--shadow-hover)] text-warm-ivory relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <AlertCircle className="w-64 h-64" />
        </div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <BotMessageSquare className="w-5 h-5" />
          AI Business Insight
        </h3>
        <p className="text-warm-ivory/90 max-w-2xl text-lg leading-relaxed">
          Your weekend sales are tracking 22% higher than last week. Consider restocking <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-lg">Aashirvaad Atta 5kg</span> as it will run out by Tuesday at this rate.
        </p>
      </motion.div>
    </motion.div>
  );
}
