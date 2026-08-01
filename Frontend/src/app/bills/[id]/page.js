'use client';

import { motion } from 'framer-motion';
import { pageVariants } from '@/utils/animations';
import { ArrowLeft, Printer, Share2, Download, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function BillDetails({ params }) {
  // In Next.js 15, params is a Promise, so we must unwrap it using React.use()
  const resolvedParams = use(params);
  const billId = resolvedParams.id;

  const mockBill = {
    id: billId,
    date: 'Oct 24, 2026',
    time: '02:30 PM',
    customer: { name: 'Rahul Sharma', phone: '+91 98765 43210' },
    status: 'Paid',
    method: 'UPI',
    items: [
      { name: 'Aashirvaad Atta 5kg', qty: 1, price: 250, total: 250 },
      { name: 'Fortune Sunflower Oil 1L', qty: 2, price: 140, total: 280 },
      { name: 'Tata Salt 1kg', qty: 1, price: 25, total: 25 },
      { name: 'Maggi Noodles 4-Pack', qty: 1, price: 56, total: 56 },
    ],
    subtotal: 611,
    tax: 30.55,
    total: 641.55,
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto space-y-8"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/bills" className="p-2 bg-off-white rounded-xl border border-soft-stone hover:bg-soft-stone/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Bill {mockBill.id}</h1>
            <p className="text-neutral-500 mt-1">{mockBill.date} at {mockBill.time}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-soft-stone rounded-xl text-sm font-medium hover:bg-warm-ivory transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-soft-stone rounded-xl text-sm font-medium hover:bg-warm-ivory transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-forest-green text-warm-ivory rounded-xl text-sm font-medium hover:bg-forest-green/90 shadow-md shadow-forest-green/20 transition-colors">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Receipt */}
        <div className="md:col-span-2 bg-off-white rounded-[24px] p-8 shadow-[var(--shadow-soft)] border border-soft-stone relative">
          {/* Status Badge */}
          <div className="absolute top-8 right-8">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald/10 text-emerald rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {mockBill.status}
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-1">Billed To</h2>
            <p className="text-lg font-semibold text-neutral-900">{mockBill.customer.name}</p>
            <p className="text-neutral-500">{mockBill.customer.phone}</p>
          </div>

          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-soft-stone/80 text-sm text-neutral-500">
                  <th className="pb-4 font-medium">Item Description</th>
                  <th className="pb-4 font-medium text-center">Qty</th>
                  <th className="pb-4 font-medium text-right">Price</th>
                  <th className="pb-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-neutral-700">
                {mockBill.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-soft-stone/40">
                    <td className="py-4 font-medium">{item.name}</td>
                    <td className="py-4 text-center">{item.qty}</td>
                    <td className="py-4 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="py-4 text-right font-semibold text-neutral-900">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-6 flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span>₹{mockBill.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Tax (5%)</span>
                <span>₹{mockBill.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-soft-stone">
                <span className="font-medium text-neutral-900 text-lg">Total</span>
                <span className="text-2xl font-bold text-forest-green">₹{mockBill.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details Side Panel */}
        <div className="space-y-6">
          <div className="bg-off-white rounded-[24px] p-6 shadow-[var(--shadow-soft)] border border-soft-stone">
            <h3 className="text-lg font-semibold mb-4">Payment Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Method</p>
                <p className="font-medium">{mockBill.method}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Transaction ID</p>
                <p className="font-medium font-mono text-sm">UPI9876543210ABC</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Date</p>
                <p className="font-medium">{mockBill.date}, {mockBill.time}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
