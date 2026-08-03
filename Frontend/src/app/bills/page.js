'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '@/utils/animations';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

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
      className="max-w-6xl mx-auto space-y-8 min-w-0"
    >
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">Bills</h1>
          <p className="text-neutral-500 mt-1">Manage and track your transactions.</p>
        </div>
        <button 
          onClick={() => router.push('/billing?autoStart=true')}
          className="px-5 py-2.5 bg-forest-green text-warm-ivory rounded-xl font-medium shadow-md shadow-forest-green/20 hover:bg-forest-green/90 transition-colors"
        >
          Create New Bill
        </button>
      </header>

      {error && (
        <div className="p-4 bg-muted-red/10 border border-muted-red/20 rounded-2xl flex items-center gap-3 text-muted-red">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-off-white rounded-3xl p-4 md:p-6 shadow-[var(--shadow-soft)] border border-soft-stone min-w-0">
        
        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-forest-green" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-soft-stone text-xs md:text-sm text-neutral-600">
                  <th className="pb-4 font-medium pl-2 md:pl-4">Bill ID</th>
                  <th className="pb-4 font-medium pl-2">Token No</th>
                  <th className="hidden md:table-cell pb-4 font-medium">Date & Time</th>
                  <th className="pb-4 font-medium pl-2">Amount</th>
                  <th className="pb-4 font-medium pl-2">Status</th>
                  <th className="hidden md:table-cell pb-4 font-medium">Method</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-neutral-500">
                      No bills found.
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
                        className="border-b border-soft-stone hover:bg-warm-ivory/50 transition-colors group cursor-pointer text-sm"
                      >
                        <td className="py-4 pl-2 md:pl-4 font-medium text-neutral-700">
                          <div>{displayId}</div>
                          <div className="text-[10px] text-neutral-500 md:hidden mt-0.5">
                            {new Date(bill.createdAt).toLocaleDateString()} {new Date(bill.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="py-4 pl-2 text-neutral-900 font-semibold">{tokenNo}</td>
                        <td className="hidden md:table-cell py-4 text-neutral-500 text-sm">
                          {new Date(bill.createdAt).toLocaleDateString()} {new Date(bill.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="py-4 pl-2 font-semibold text-neutral-900">₹{bill.totalAmount}</td>
                        <td className="py-4 pl-2">
                          <span className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${
                            bill.paymentStatus === 'paid' ? 'bg-emerald/10 text-emerald' : 'bg-yellow-500/10 text-yellow-700'
                          }`}>
                            {bill.paymentStatus}
                          </span>
                          <div className="text-[10px] text-neutral-500 md:hidden mt-0.5 uppercase tracking-wider">{bill.paymentMethod || '-'}</div>
                        </td>
                        <td className="hidden md:table-cell py-4 text-neutral-600 text-sm uppercase">{bill.paymentMethod || '-'}</td>
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
