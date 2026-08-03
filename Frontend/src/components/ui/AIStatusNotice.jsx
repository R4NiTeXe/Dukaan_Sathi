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
      online: "Voice Billing System is ready to use",
      offline: "Voice Billing is unavailable right now. Please try again later."
    },
    advisor: {
      online: "AI Advisor is online and ready to assist you",
      offline: "AI Advisor is not responding due to a server issue."
    }
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
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-100 text-neutral-500 text-sm font-medium rounded-xl border border-neutral-200 mb-6 shadow-sm"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking server status...
        </motion.div>
      )}

      {status === 'online' && (
        <motion.div 
          key="online"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald/10 text-emerald text-sm font-medium rounded-xl border border-emerald/20 mb-6 shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          {currentMessages.online}
        </motion.div>
      )}

      {status === 'offline' && (
        <motion.div 
          key="offline"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-muted-red/10 text-muted-red text-sm font-medium rounded-xl border border-muted-red/20 mb-6 shadow-sm"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {currentMessages.offline}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
