'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '@/utils/animations';
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import api from '@/services/api';
import Badge from '@/components/ui/Badge';
import { SkeletonLine, SkeletonCard } from '@/components/ui/Skeleton';

export default function BillDetails({ params }) {
  // In Next.js 15, params is a Promise, so we must unwrap it using React.use()
  const resolvedParams = use(params);
  const billId = resolvedParams.id;

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/bills/${billId}`);
        setBill(response.data.data.bill);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch bill details');
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [billId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl min-w-0 space-y-8">
        <div className="flex items-center gap-4">
          <SkeletonLine className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <SkeletonLine className="h-8 w-48" />
            <SkeletonLine className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <SkeletonCard className="min-h-[400px] md:col-span-2" />
          <SkeletonCard className="min-h-[200px]" />
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="mx-auto max-w-4xl min-w-0 space-y-8">
        <div
          role="alert"
          className="bg-muted-red/10 border-muted-red/20 text-muted-red flex items-center gap-3 rounded-2xl border p-4"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error || 'Bill not found'}</p>
        </div>
      </div>
    );
  }

  const date = new Date(bill.createdAt);
  const displayDate = date.toLocaleDateString('en-GB');
  const displayTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Assume items is an array of { productName, quantity, price, total }
  // Subtotal is totalAmount / 1.05 if 5% tax was assumed, but let's just use totalAmount
  // Usually tax is part of bill, if not we just show total

  const lineTotal = (item) => (item.pricePerUnit ? item.price * item.quantity : item.price);
  const unitPrice = (item) => (item.pricePerUnit ? item.price : item.price / item.quantity);

  const subtotal = bill.items.reduce((acc, item) => acc + lineTotal(item), 0);
  const tax = bill.totalAmount - subtotal; // Simple assumption if totalAmount > subtotal, else tax is 0

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto max-w-4xl min-w-0 space-y-8"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/bills"
            className="bg-off-white border-soft-stone hover:bg-soft-stone/50 rounded-xl border p-2 transition-colors"
            aria-label="Back to bills"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-900">
              Bill {bill.billNumber || bill._id.substring(bill._id.length - 6).toUpperCase()}
            </h1>
            <p className="mt-1 text-neutral-500">
              {displayDate} at {displayTime}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Main Receipt */}
        <div className="bg-off-white border-soft-stone relative rounded-2xl border p-4 shadow-[var(--shadow-soft)] sm:p-6 md:col-span-2 md:p-8">
          {/* Status Badge */}
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
            <Badge variant={bill.paymentStatus === 'paid' ? 'success' : 'warning'}>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {bill.paymentStatus}
            </Badge>
          </div>

          <div className="mb-8 pr-16 sm:mb-10 sm:pr-0">
            <h2 className="mb-1 text-sm font-medium tracking-wider text-neutral-500 uppercase">
              Token No
            </h2>
            <p className="text-2xl font-bold text-neutral-900">
              {bill.billNumber ? bill.billNumber.split('-').pop() : '01'}
            </p>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[380px] border-collapse text-left">
              <thead>
                <tr className="border-soft-stone border-b text-sm text-neutral-600">
                  <th className="pb-4 font-medium">Item Description</th>
                  <th className="pb-4 text-center font-medium">Qty</th>
                  <th className="pb-4 text-right font-medium">Price</th>
                  <th className="pb-4 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="text-neutral-700">
                {bill.items?.map((item, idx) => (
                  <tr key={idx} className="border-soft-stone border-b">
                    <td className="py-4 min-w-0 break-words font-medium">{item.productName}</td>
                    <td className="py-4 text-center">{item.quantity}</td>
                    <td className="py-4 text-right">₹{unitPrice(item).toFixed(2)}</td>
                    <td className="py-4 text-right font-semibold text-neutral-900">
                      ₹{lineTotal(item).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end pt-6">
            <div className="w-full space-y-3 sm:w-64">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Tax</span>
                <span>₹{Math.max(0, tax).toFixed(2)}</span>
              </div>
              <div className="border-soft-stone flex items-center justify-between border-t pt-3">
                <span className="text-lg font-medium text-neutral-900">Total</span>
                <span className="text-forest-green text-2xl font-bold">
                  ₹{bill.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details Side Panel */}
        <div className="space-y-6">
          <div className="bg-off-white border-soft-stone rounded-2xl border p-6 shadow-[var(--shadow-soft)]">
            <h3 className="mb-4 text-lg font-semibold">Payment Info</h3>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-sm text-neutral-500">Method</p>
                <p className="font-medium capitalize">{bill.paymentMethod || 'Not specified'}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-neutral-500">Transaction ID</p>
                <p className="break-all font-mono text-sm font-medium">{bill._id.toUpperCase()}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-neutral-500">Date</p>
                <p className="font-medium">
                  {displayDate}, {displayTime}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
