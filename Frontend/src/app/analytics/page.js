'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, ReceiptText, Wallet, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import { SkeletonLine, SkeletonCard } from '@/components/ui/Skeleton';

const PAYMENT_COLORS = {
  cash: 'var(--color-forest-green)',
  upi: '#3b82f6',
  unpaid: 'var(--color-muted-red)'
};

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
      <div className="max-w-7xl mx-auto space-y-6 min-w-0">
        <div className="flex items-center gap-3">
          <SkeletonLine className="h-6 w-6 rounded-lg" />
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-24" />
            <SkeletonLine className="h-3 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard className="min-h-[300px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="p-4 bg-muted-red/10 border border-muted-red/20 rounded-2xl flex items-center gap-3 text-muted-red max-w-7xl mx-auto">
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
      <PageHeader
        title="Analytics"
        description="Track your business growth"
        icon={BarChart3}
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-4 md:px-6 bg-off-white pt-2">
        {[
          { title: "Today's Total Sale", value: `₹${summary?.todayRevenue?.toLocaleString() || 0}`, change: 'Today', icon: Wallet, iconColor: 'text-[#64748b]', iconBg: 'bg-[#f1f5f9]' },
          { title: 'Total Bills', value: summary?.totalBills || 0, change: 'Lifetime', icon: ReceiptText, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10' },
          { title: 'Avg. Bill Value', value: `₹${summary?.totalBills ? Math.round(summary.totalRevenue / summary.totalBills).toLocaleString() : 0}`, change: 'Per Order', icon: TrendingUp, iconColor: 'text-emerald', iconBg: 'bg-emerald/10' },
          { title: 'Unpaid Bills', value: summary?.unpaidBills || 0, change: 'Pending', icon: AlertCircle, iconColor: 'text-muted-red', iconBg: 'bg-muted-red/10' }
        ].map((kpi, idx) => (
          <motion.div key={idx} variants={listItemVariants} initial="hidden" animate="show" transition={{ delay: idx * 0.1 }} className="bg-off-white rounded-xl p-5 border border-soft-stone shadow-sm">
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

      <div className="grid grid-cols-1 gap-4 px-4 md:px-6 bg-off-white pb-6 rounded-b-2xl">
        {/* Payment Mode Analysis */}
        <div className="bg-off-white rounded-xl p-5 border border-soft-stone shadow-sm flex flex-col">
          <h3 className="text-[14px] font-bold text-neutral-900 mb-6">Payment Mode Analysis</h3>
          <div className="flex-1 w-full flex flex-col">
            {summary?.paymentModes?.length > 0 ? (
              <div className="flex flex-col h-full pb-4">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.paymentModes}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="total"
                        nameKey="_id"
                      >
                        {summary.paymentModes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry._id] || 'var(--color-sage-green)'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [`₹${value.toLocaleString()} (${props.payload.count} Bills)`, name.toUpperCase()]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?._id?.toUpperCase() || label}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-soft)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  {summary.paymentModes.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[entry._id] || 'var(--color-sage-green)' }}></div>
                      <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">{entry._id}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400 pb-10">No payment data available</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
