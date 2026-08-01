'use client';

import { motion } from 'framer-motion';
import { pageVariants } from '@/utils/animations';
import { Store, UserCircle, Bell, Shield, Palette } from 'lucide-react';

export default function Settings() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Settings</h1>
        <p className="text-neutral-500 mt-1">Manage your store details and app preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="space-y-1">
          {[
            { name: 'Store Profile', icon: Store, active: true },
            { name: 'Account', icon: UserCircle, active: false },
            { name: 'Notifications', icon: Bell, active: false },
            { name: 'Appearance', icon: Palette, active: false },
            { name: 'Security', icon: Shield, active: false },
          ].map((item, idx) => (
            <button
              key={idx}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                item.active 
                  ? 'bg-sage-green/10 text-forest-green' 
                  : 'text-neutral-600 hover:bg-soft-stone/50 hover:text-neutral-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-off-white rounded-[24px] p-8 shadow-[var(--shadow-soft)] border border-soft-stone/50">
            <h2 className="text-xl font-bold mb-6 text-neutral-900">Store Profile</h2>
            
            <form className="space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-soft-stone">
                <div className="w-20 h-20 rounded-2xl bg-forest-green text-warm-ivory flex items-center justify-center text-2xl font-bold">
                  KS
                </div>
                <div>
                  <button type="button" className="px-4 py-2 bg-warm-ivory border border-soft-stone rounded-xl text-sm font-medium hover:bg-soft-stone/30 transition-colors">
                    Upload Logo
                  </button>
                  <p className="text-xs text-neutral-500 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Store Name</label>
                  <input 
                    type="text" 
                    defaultValue="Kumar Supermarket"
                    className="w-full px-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Phone Number</label>
                  <input 
                    type="text" 
                    defaultValue="+91 9876543210"
                    className="w-full px-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-colors"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Store Address</label>
                  <textarea 
                    defaultValue="123 Main Bazaar, City Center, New Delhi - 110001"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-warm-ivory border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="button" className="px-6 py-2.5 bg-forest-green text-warm-ivory rounded-xl text-sm font-medium hover:bg-forest-green/90 shadow-md shadow-forest-green/20 transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
