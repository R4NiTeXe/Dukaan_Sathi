'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, Users, ReceiptText, Wallet, Plus, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import api from '@/services/api';

export default function AnalyticsDashboard() {
  const [data, setData] = useState({
    summary: null,
    monthlyRevenue: [],
    customerReport: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, monthlyRes, customerRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/analytics/monthly'),
          api.get('/analytics/customer-report'),
        ]);

        const formattedMonthly = monthlyRes.data.data?.data?.map(item => {
          const date = new Date(item.month);
          return {
            name: date.toLocaleDateString('en-US', { month: 'short' }),
            total: item.totalRevenue,
          };
        }) || [];

        const formattedCustomers = customerRes.data.data?.data?.slice(0, 5).map(c => ({
          name: c.name?.split(' ')[0] || 'Unknown',
          spent: c.totalSpent,
        })) || [];

        setData({
          summary: summaryRes.data.data,
          monthlyRevenue: formattedMonthly,
          customerReport: formattedCustomers,
        });
      } catch (err) {
        console.error(err);
        setError('Failed to fetch analytics data');
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

  if (error) {
    return (
      <div className="p-4 bg-muted-red/10 border border-muted-red/20 rounded-2xl flex items-center gap-3 text-muted-red max-w-7xl mx-auto">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  const { summary } = data;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto space-y-6 min-w-0"
    >
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-off-white rounded-2xl p-4 md:p-6 pb-2 border border-soft-stone">
        <div className="flex items-center gap-3">
          <div className="text-forest-green">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Analytics</h1>
            <p className="text-[12px] text-neutral-500">Track your business growth</p>
          </div>
        </div>
      </header>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-4 md:px-6 bg-off-white pt-2">
        {[
          { title: 'Total Bills', value: summary?.totalBills || 0, change: 'Lifetime', icon: ReceiptText, iconColor: 'text-[#64748b]', iconBg: 'bg-[#f1f5f9]' },
          { title: 'Customers', value: summary?.topCustomers?.length || 0, change: 'Active', icon: Users, iconColor: 'text-purple-500', iconBg: 'bg-purple-50' },
          { title: 'Avg. Bill Value', value: `₹${summary?.totalBills ? Math.round(summary.totalRevenue / summary.totalBills).toLocaleString() : 0}`, change: 'Per Order', icon: TrendingUp, iconColor: 'text-emerald', iconBg: 'bg-emerald/10' },
          { title: 'Unpaid Bills', value: summary?.unpaidBills || 0, change: 'Pending', icon: AlertCircle, iconColor: 'text-muted-red', iconBg: 'bg-muted-red/10' }
        ].map((kpi, idx) => (
          <motion.div key={idx} variants={listItemVariants} initial="hidden" animate="show" transition={{ delay: idx * 0.1 }} className="bg-off-white rounded-[16px] p-5 border border-soft-stone shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
              <h3 className="text-[13px] font-bold text-neutral-700">{kpi.title}</h3>
            </div>
            <div className="text-xl md:text-[28px] font-bold text-neutral-900 mb-2">{kpi.value}</div>
            <span className="text-[#22c55e] text-[11px] font-bold flex items-center gap-1">
              <span className="text-neutral-400 font-medium">{kpi.change}</span>
            </span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 md:px-6 bg-off-white pb-6 rounded-b-2xl">
        {/* Payment Mode Analysis */}
        <div className="bg-off-white rounded-[16px] p-5 border border-soft-stone shadow-sm flex flex-col">
          <h3 className="text-[14px] font-bold text-neutral-900 mb-6">Payment Mode Analysis</h3>
          <div className="flex-1 w-full flex flex-col">
            {summary?.paymentModes?.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.paymentModes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="total"
                      nameKey="_id"
                    >
                      {summary.paymentModes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--color-forest-green)' : 'var(--color-sage-green)'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Total']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?._id || label}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-soft)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400 pb-10">No payment data available</div>
            )}
          </div>
        </div>

        {/* Top Customers (Replaced Payment Methods) */}
        <div className="bg-off-white rounded-[16px] p-5 border border-soft-stone shadow-sm flex flex-col">
          <h3 className="text-[14px] font-bold text-neutral-900 mb-6">Top Customers by Spending</h3>
          <div className="flex-1 w-full flex flex-col">
            {data.customerReport.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.customerReport} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-soft-stone)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'var(--color-neutral-600)', fontSize: 12}} width={80} />
                    <Tooltip 
                      cursor={{fill: 'var(--color-warm-ivory)'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-soft)' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Spent']}
                    />
                    <Bar dataKey="spent" radius={[0, 8, 8, 0]} barSize={24}>
                      {data.customerReport.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-forest-green)' : 'var(--color-sage-green)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400 pb-10">No customer data available</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
