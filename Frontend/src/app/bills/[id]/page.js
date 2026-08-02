"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { pageVariants } from "@/utils/animations";
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import api from "@/services/api";

export default function BillDetails({ params }) {
  // In Next.js 15, params is a Promise, so we must unwrap it using React.use()
  const resolvedParams = use(params);
  const billId = resolvedParams.id;

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/bills/${billId}`);
        setBill(response.data.data.bill);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch bill details");
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [billId]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-green" />
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 min-w-0">
        <div className="p-4 bg-muted-red/10 border border-muted-red/20 rounded-2xl flex items-center gap-3 text-muted-red">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error || "Bill not found"}</p>
        </div>
      </div>
    );
  }

  const date = new Date(bill.createdAt);
  const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const displayTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Assume items is an array of { productName, quantity, price, total }
  // Subtotal is totalAmount / 1.05 if 5% tax was assumed, but let's just use totalAmount
  // Usually tax is part of bill, if not we just show total
  
  const lineTotal = (item) =>
    item.pricePerUnit ? item.price * item.quantity : item.price;
  const unitPrice = (item) =>
    item.pricePerUnit ? item.price : item.price / item.quantity;

  const subtotal = bill.items.reduce((acc, item) => acc + lineTotal(item), 0);
  const tax = bill.totalAmount - subtotal; // Simple assumption if totalAmount > subtotal, else tax is 0

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto space-y-8 min-w-0"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/bills"
            className="p-2 bg-off-white rounded-xl border border-soft-stone hover:bg-soft-stone/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Bill {bill.billNumber || bill._id.substring(bill._id.length - 6).toUpperCase()}
            </h1>
            <p className="text-neutral-500 mt-1">
              {displayDate} at {displayTime}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Receipt */}
        <div className="md:col-span-2 bg-off-white rounded-[24px] p-8 shadow-[var(--shadow-soft)] border border-soft-stone relative">
          {/* Status Badge */}
          <div className="absolute top-8 right-8">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              bill.status === 'paid' ? 'bg-emerald/10 text-emerald' : 'bg-yellow-500/10 text-yellow-700'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
              {bill.status}
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-1">
              Billed To
            </h2>
            <p className="text-lg font-semibold text-neutral-900">
              {bill.customer?.customerNumber || "Walk-in Customer"}
            </p>
          </div>

          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-soft-stone text-sm text-neutral-600">
                  <th className="pb-4 font-medium">Item Description</th>
                  <th className="pb-4 font-medium text-center">Qty</th>
                  <th className="pb-4 font-medium text-right">Price</th>
                  <th className="pb-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-neutral-700">
                {bill.items?.map((item, idx) => (
                  <tr key={idx} className="border-b border-soft-stone">
                    <td className="py-4 font-medium">{item.productName}</td>
                    <td className="py-4 text-center">{item.quantity}</td>
                    <td className="py-4 text-right">
                      ₹{unitPrice(item).toFixed(2)}
                    </td>
                    <td className="py-4 text-right font-semibold text-neutral-900">
                      ₹{lineTotal(item).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-6 flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Tax</span>
                <span>₹{Math.max(0, tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-soft-stone">
                <span className="font-medium text-neutral-900 text-lg">
                  Total
                </span>
                <span className="text-2xl font-bold text-forest-green">
                  ₹{bill.totalAmount.toFixed(2)}
                </span>
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
                <p className="font-medium capitalize">{bill.paymentMethod || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Transaction ID</p>
                <p className="font-medium font-mono text-sm">
                  {bill._id.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Date</p>
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
