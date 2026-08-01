'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { Mail, Phone, MoreHorizontal, Loader2, AlertCircle } from 'lucide-react';
import AddCustomerModal from '@/components/modals/AddCustomerModal';
import api from '@/services/api';

export default function CustomersList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers?limit=50');
      setCustomers(response.data.data.customers || []);
    } catch (err) {
      setError('Failed to fetch customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-6xl mx-auto space-y-8 min-w-0"
    >
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">Customers</h1>
          <p className="text-neutral-500 mt-1">Manage your customer relationships and history.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-forest-green text-warm-ivory rounded-xl font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors"
        >
          Add Customer
        </button>
      </header>

      {error && (
        <div className="p-4 bg-muted-red/10 border border-muted-red/20 rounded-2xl flex items-center gap-3 text-muted-red">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-off-white rounded-[24px] p-4 md:p-6 shadow-[var(--shadow-soft)] border border-soft-stone min-w-0">
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-forest-green" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-soft-stone text-sm text-neutral-600">
                  <th className="pb-4 font-medium pl-4">Customer Name</th>
                  <th className="pb-4 font-medium">Contact</th>
                  <th className="pb-4 font-medium">Total Spent</th>
                  <th className="pb-4 font-medium">Last Added</th>
                  <th className="pb-4 font-medium text-right pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-neutral-500">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer, idx) => (
                    <motion.tr 
                      key={customer._id}
                      variants={listItemVariants}
                      initial="hidden"
                      animate="show"
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-soft-stone hover:bg-warm-ivory/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 pl-4">
                        <div className="font-semibold text-neutral-900">{customer.name}</div>
                        <div className="text-xs text-neutral-400 mt-0.5">{customer._id.substring(customer._id.length - 6)}</div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center text-sm text-neutral-600 gap-2 mb-1">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          {customer.phone || 'N/A'}
                        </div>
                        {customer.email && (
                          <div className="flex items-center text-xs text-neutral-500 gap-2">
                            <Mail className="w-3.5 h-3.5 text-neutral-400" />
                            {customer.email}
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-forest-green font-semibold">₹{customer.totalSpent?.toLocaleString() || 0}</td>
                      <td className="py-4 text-neutral-500 text-sm">{new Date(customer.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 text-right pr-4">
                        <button className="p-2 text-neutral-500 hover:text-forest-green hover:bg-sage-green/10 rounded-lg transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddCustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCustomerAdded={fetchCustomers}
      />
    </motion.div>
  );
}
