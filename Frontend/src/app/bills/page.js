'use client';

import { motion } from 'framer-motion';
import { pageVariants } from '@/utils/animations';
import { Search, Filter, ArrowUpRight, Download } from 'lucide-react';

const mockBills = [
  { id: 'BL-001', customer: 'Rahul Sharma', date: 'Today, 2:30 PM', amount: 450, status: 'Paid', method: 'UPI' },
  { id: 'BL-002', customer: 'Sneha Gupta', date: 'Today, 1:15 PM', amount: 1200, status: 'Paid', method: 'Cash' },
  { id: 'BL-003', customer: 'Walk-in', date: 'Yesterday', amount: 80, status: 'Paid', method: 'UPI' },
  { id: 'BL-004', customer: 'Amit Kumar', date: 'Yesterday', amount: 3500, status: 'Pending', method: 'None' },
  { id: 'BL-005', customer: 'Priya Singh', date: 'Oct 12', amount: 45, status: 'Paid', method: 'Cash' },
];

export default function BillsList() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-6xl mx-auto space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Bills</h1>
          <p className="text-neutral-500 mt-1">Manage and track your transactions.</p>
        </div>
        <button className="px-5 py-2.5 bg-forest-green text-warm-ivory rounded-xl font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors">
          Create New Bill
        </button>
      </header>

      <div className="bg-off-white rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
        
        {/* Table Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search by Bill ID or Customer"
              className="w-full pl-10 pr-4 py-2 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-soft-stone rounded-xl text-sm font-medium hover:bg-warm-ivory transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-soft-stone rounded-xl text-sm font-medium hover:bg-warm-ivory transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-soft-stone/80 text-sm text-neutral-500">
                <th className="pb-4 font-medium pl-4">Bill ID</th>
                <th className="pb-4 font-medium">Customer</th>
                <th className="pb-4 font-medium">Date</th>
                <th className="pb-4 font-medium">Amount</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium">Method</th>
                <th className="pb-4 font-medium text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockBills.map((bill) => (
                <tr key={bill.id} className="border-b border-soft-stone/40 hover:bg-warm-ivory/50 transition-colors group cursor-pointer">
                  <td className="py-4 pl-4 font-medium text-neutral-700">{bill.id}</td>
                  <td className="py-4 text-neutral-900">{bill.customer}</td>
                  <td className="py-4 text-neutral-500 text-sm">{bill.date}</td>
                  <td className="py-4 font-semibold text-neutral-900">₹{bill.amount}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      bill.status === 'Paid' ? 'bg-emerald/10 text-emerald' : 'bg-muted-red/10 text-muted-red'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="py-4 text-neutral-500 text-sm">{bill.method}</td>
                  <td className="py-4 text-right pr-4">
                    <button className="p-2 text-neutral-400 hover:text-forest-green hover:bg-sage-green/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
      </div>
    </motion.div>
  );
}
