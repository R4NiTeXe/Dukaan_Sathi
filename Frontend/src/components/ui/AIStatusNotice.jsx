'use client';

import { useState, useEffect } from 'react';
import { ServerCrash, Server, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';

export default function AIStatusNotice({ type = 'voice' }) {
  const [status, setStatus] = useState('checking'); // checking, online, offline

  useEffect(() => {
    let mounted = true;

    const checkHealth = async () => {
      try {
        const response = await api.get('/assistant/health');
        if (mounted) {
          setStatus(response.data.data.isUp ? 'online' : 'offline');
        }
      } catch (err) {
        if (mounted) setStatus('offline');
      }
    };

    checkHealth();

    // Poll every 30 seconds to keep the status updated
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const messages = {
    voice: {
      online: 'Voice Billing System is ready to use',
      offline: 'Voice Billing is unavailable right now. Please try again later.',
    },
    advisor: {
      online: 'AI Advisor is online and ready to assist you',
      offline: 'AI Advisor is not responding due to a server issue.',
    },
  };

  const currentMessages = messages[type] || messages.voice;

  return (
    <AnimatePresence mode="wait">
      {status === 'checking' && (
        <motion.div
          key="checking"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-500 shadow-sm"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking server status...
        </motion.div>
      )}

      {status === 'online' && (
        <motion.div
          key="online"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-emerald/10 text-emerald border-emerald/20 mb-6 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm"
        >
          <CheckCircle2 className="h-4 w-4" />
          {currentMessages.online}
        </motion.div>
      )}

      {status === 'offline' && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-muted-red/10 text-muted-red border-muted-red/20 mb-6 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {currentMessages.offline}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
