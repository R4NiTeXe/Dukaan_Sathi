'use client';

import { motion } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, Users, Package, Wallet } from 'lucide-react';

const monthlyRevenue = [
  { name: 'May', total: 120000 },
  { name: 'Jun', total: 150000 },
  { name: 'Jul', total: 145000 },
  { name: 'Aug', total: 180000 },
  { name: 'Sep', total: 210000 },
  { name: 'Oct', total: 250000 },
];

const categorySales = [
  { name: 'Grocery', value: 400 },
  { name: 'Dairy', value: 300 },
  { name: 'Snacks', value: 300 },
  { name: 'Beverages', value: 200 },
];

const COLORS = ['var(--color-forest-green)', 'var(--color-sage-green)', 'var(--color-emerald)', 'var(--color-muted-indigo)'];

export default function AnalyticsDashboard() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Analytics</h1>
          <p className="text-neutral-500 mt-1">Deep insights into your business performance.</p>
        </div>
        <select className="px-4 py-2 bg-off-white border border-soft-stone rounded-xl text-sm font-medium focus:outline-none focus:border-sage-green shadow-sm">
          <option>Last 6 Months</option>
          <option>This Year</option>
          <option>Last 30 Days</option>
        </select>
      </header>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Revenue', value: '₹10,55,000', change: '+24%', icon: Wallet, color: 'text-emerald' },
          { title: 'Total Customers', value: '1,248', change: '+12%', icon: Users, color: 'text-muted-indigo' },
          { title: 'Items Sold', value: '14,592', change: '+18%', icon: Package, color: 'text-forest-green' },
          { title: 'Avg Order Value', value: '₹845', change: '+5%', icon: TrendingUp, color: 'text-sage-green' }
        ].map((kpi, idx) => (
          <motion.div key={idx} variants={listItemVariants} initial="hidden" animate="show" transition={{ delay: idx * 0.1 }} className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-warm-ivory border border-soft-stone/50 ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className="text-emerald text-sm font-medium px-2 py-1 bg-emerald/10 rounded-lg">{kpi.change}</span>
            </div>
            <h3 className="text-sm font-medium text-neutral-500 mb-1">{kpi.title}</h3>
            <div className="text-2xl font-bold text-neutral-900">{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
          <h3 className="text-lg font-semibold mb-6">Revenue Growth (Last 6 Months)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotalMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-emerald)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-emerald)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-soft-stone)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-hover)' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="total" stroke="var(--color-emerald)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotalMonth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50 flex flex-col">
          <h3 className="text-lg font-semibold mb-2">Sales by Category</h3>
          <div className="flex-1 w-full flex items-center justify-center min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-soft)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {categorySales.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <span className="text-sm font-medium text-neutral-600">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
