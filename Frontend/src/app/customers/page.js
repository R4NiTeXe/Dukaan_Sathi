'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { Search, Filter, Mail, Phone, MoreHorizontal } from 'lucide-react';
import AddCustomerModal from '@/components/modals/AddCustomerModal';

const mockCustomers = [
  { id: 'C-001', name: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul.s@example.com', orders: 12, spent: 4500, lastVisit: 'Today' },
  { id: 'C-002', name: 'Sneha Gupta', phone: '+91 87654 32109', email: 'sneha.g@example.com', orders: 5, spent: 2100, lastVisit: '2 days ago' },
  { id: 'C-003', name: 'Amit Kumar', phone: '+91 76543 21098', email: 'amit.k@example.com', orders: 24, spent: 12500, lastVisit: 'Last week' },
  { id: 'C-004', name: 'Priya Singh', phone: '+91 99887 76655', email: 'priya.s@example.com', orders: 2, spent: 450, lastVisit: 'Oct 12' },
];

export default function CustomersList() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Customers</h1>
          <p className="text-neutral-500 mt-1">Manage your customer relationships and history.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-forest-green text-warm-ivory rounded-xl font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors"
        >
          Add Customer
        </button>
      </header>

      <div className="bg-off-white rounded-[24px] p-6 shadow-[var(--shadow-soft)] border border-soft-stone/50">
        
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search customers by name or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-soft-stone rounded-xl text-sm font-medium hover:bg-warm-ivory transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-soft-stone/80 text-sm text-neutral-500">
                <th className="pb-4 font-medium pl-4">Customer Name</th>
                <th className="pb-4 font-medium">Contact</th>
                <th className="pb-4 font-medium">Total Orders</th>
                <th className="pb-4 font-medium">Total Spent</th>
                <th className="pb-4 font-medium">Last Visit</th>
                <th className="pb-4 font-medium text-right pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {mockCustomers.map((customer, idx) => (
                <motion.tr 
                  key={customer.id}
                  variants={listItemVariants}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-soft-stone/40 hover:bg-warm-ivory/50 transition-colors group cursor-pointer"
                >
                  <td className="py-4 pl-4">
                    <div className="font-semibold text-neutral-900">{customer.name}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">{customer.id}</div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center text-sm text-neutral-600 gap-2 mb-1">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      {customer.phone}
                    </div>
                    <div className="flex items-center text-xs text-neutral-500 gap-2">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      {customer.email}
                    </div>
                  </td>
                  <td className="py-4 text-neutral-700 font-medium">{customer.orders}</td>
                  <td className="py-4 text-forest-green font-semibold">₹{customer.spent.toLocaleString()}</td>
                  <td className="py-4 text-neutral-500 text-sm">{customer.lastVisit}</td>
                  <td className="py-4 text-right pr-4">
                    <button className="p-2 text-neutral-400 hover:text-forest-green hover:bg-sage-green/10 rounded-lg transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
      </div>

      <AddCustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
}
