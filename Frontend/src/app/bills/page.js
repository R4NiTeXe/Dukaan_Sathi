'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '@/utils/animations';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonLine } from '@/components/ui/Skeleton';

export default function BillsList() {
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        const response = await api.get('/bills?limit=50');
        setBills(response.data.data.bills || []);
      } catch (err) {
        setError('Failed to fetch bills');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
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
        title="Bills"
        description="Manage and track your transactions."
        action={
          <Button onClick={() => router.push('/billing?autoStart=true')}>
            <Plus className="h-4 w-4" /> Create New Bill
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
        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <SkeletonLine className="h-4 w-1/6" />
                  <SkeletonLine className="h-4 w-1/12" />
                  <SkeletonLine className="h-4 w-1/4" />
                  <SkeletonLine className="h-4 w-1/8" />
                  <SkeletonLine className="h-4 w-1/8" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full border-collapse text-left whitespace-nowrap">
              <thead>
                <tr className="border-soft-stone border-b text-xs text-neutral-600 md:text-sm">
                  <th className="pb-4 pl-2 font-medium md:pl-4">Bill ID</th>
                  <th className="pb-4 pl-2 font-medium">Token No</th>
                  <th className="hidden pb-4 font-medium md:table-cell">Date & Time</th>
                  <th className="pb-4 pl-2 font-medium">Amount</th>
                  <th className="pb-4 pl-2 font-medium">Status</th>
                  <th className="hidden pb-4 font-medium md:table-cell">Method</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center">
                      <EmptyState
                        title="No bills yet"
                        description="Create your first bill to get started."
                        action={
                          <Button onClick={() => router.push('/billing?autoStart=true')} size="sm">
                            <Plus className="h-4 w-4" /> Create Bill
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => {
                    const formatBillId = (id) => {
                      if (!id) return '';
                      if (id.startsWith('BILL-')) return id.replace(/BILL-\d{4}/, 'BILL-');
                      return id.substring(id.length - 6).toUpperCase();
                    };
                    const displayId = formatBillId(bill.billNumber || bill._id);
                    const tokenNo = bill.billNumber ? bill.billNumber.split('-').pop() : '01';

                    return (
                      <tr
                        key={bill._id}
                        onClick={() => router.push(`/bills/${bill._id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/bills/${bill._id}`);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="border-soft-stone hover:bg-warm-ivory/50 group cursor-pointer border-b text-sm transition-colors"
                      >
                        <td className="py-4 pl-2 font-medium text-neutral-700 md:pl-4">
                          <div>{displayId}</div>
                          <div className="mt-0.5 text-[10px] text-neutral-500 md:hidden">
                            {new Date(bill.createdAt).toLocaleDateString('en-GB')}{' '}
                            {new Date(bill.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="py-4 pl-2 font-semibold text-neutral-900">{tokenNo}</td>
                        <td className="hidden py-4 text-sm text-neutral-500 md:table-cell">
                          {new Date(bill.createdAt).toLocaleDateString('en-GB')}{' '}
                          {new Date(bill.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-4 pl-2 font-semibold text-neutral-900">
                          ₹{bill.totalAmount}
                        </td>
                        <td className="py-4 pl-2">
                          <Badge variant={bill.paymentStatus === 'paid' ? 'success' : 'warning'}>
                            {bill.paymentStatus}
                          </Badge>
                          <div className="mt-0.5 text-[10px] tracking-wider text-neutral-500 uppercase md:hidden">
                            {bill.paymentMethod || '-'}
                          </div>
                        </td>
                        <td className="hidden py-4 text-sm text-neutral-600 uppercase md:table-cell">
                          {bill.paymentMethod || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
