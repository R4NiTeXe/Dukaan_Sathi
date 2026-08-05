'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { Plus, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import api from '@/services/api';
import AddCustomerModal from '@/components/modals/AddCustomerModal';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonLine } from '@/components/ui/Skeleton';

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
      className="mx-auto max-w-6xl min-w-0 space-y-8"
    >
      <PageHeader
        title="Customers"
        description="Customer numbers are assigned automatically."
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        }
      />

      {error && (
        <div
          role="alert"
          className="bg-muted-red/10 border-muted-red/20 text-muted-red flex items-center gap-3 rounded-2xl border p-4"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-off-white border-soft-stone min-w-0 rounded-2xl border p-4 shadow-[var(--shadow-soft)] md:p-6">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <SkeletonLine className="h-4 w-1/4" />
                  <SkeletonLine className="h-4 w-1/6" />
                  <SkeletonLine className="h-4 w-1/6" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-soft-stone border-b text-sm text-neutral-600">
                  <th className="pb-4 pl-4 font-medium">Customer No</th>
                  <th className="pb-4 font-medium">Total Purchases</th>
                  <th className="pb-4 font-medium">Added On</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center">
                      <EmptyState
                        icon={UserPlus}
                        title="No customers yet"
                        description="Add your first customer to get started."
                        action={
                          <Button onClick={() => setIsAddOpen(true)} size="sm">
                            <Plus className="h-4 w-4" /> Add Customer
                          </Button>
                        }
                      />
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
                      className="border-soft-stone hover:bg-warm-ivory/50 border-b transition-colors"
                    >
                      <td className="py-4 pl-4">
                        <span className="font-mono font-semibold text-neutral-900">
                          {customer.customerNumber}
                        </span>
                      </td>
                      <td className="text-forest-green py-4 font-semibold">
                        {customer.totalPurchases?.toLocaleString() || 0}
                      </td>
                      <td className="py-4 text-sm text-neutral-500">
                        {new Date(customer.createdAt).toLocaleDateString('en-GB')}
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
