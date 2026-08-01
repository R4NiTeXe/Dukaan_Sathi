'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { Plus, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import api from '@/services/api';
import AddCustomerModal from '@/components/modals/AddCustomerModal';

export default function CustomersList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

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
          <p className="text-neutral-500 mt-1">Customer numbers are assigned automatically.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-green text-warm-ivory rounded-xl font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
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
                  <th className="pb-4 font-medium pl-4">Customer No</th>
                  <th className="pb-4 font-medium">Total Purchases</th>
                  <th className="pb-4 font-medium">Added On</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-12 text-neutral-500">
                      <div className="flex flex-col items-center gap-3">
                        <UserPlus className="w-8 h-8 text-neutral-300" />
                        <p>No customers yet. Add your first customer to get started.</p>
                      </div>
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
                      className="border-b border-soft-stone hover:bg-warm-ivory/50 transition-colors"
                    >
                      <td className="py-4 pl-4">
                        <span className="font-semibold text-neutral-900 font-mono">{customer.customerNumber}</span>
                      </td>
                      <td className="py-4 text-forest-green font-semibold">
                        {customer.totalPurchases?.toLocaleString() || 0}
                      </td>
                      <td className="py-4 text-neutral-500 text-sm">
                        {new Date(customer.createdAt).toLocaleDateString()}
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
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCustomerAdded={fetchCustomers}
      />
    </motion.div>
  );
}
