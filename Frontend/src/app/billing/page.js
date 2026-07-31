'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, cardHover, listItemVariants } from '@/utils/animations';
import { Mic, MicOff, Check, X, Loader2, Sparkles, Plus } from 'lucide-react';

export default function VoiceBilling() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);

  // Mock handler for recording
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate stopping recording and extracting
      setIsExtracting(true);
      setTimeout(() => {
        setIsExtracting(false);
        setExtractedItems([
          { id: 1, name: 'Aashirvaad Atta', quantity: 5, unit: 'kg', price: 250 },
          { id: 2, name: 'Fortune Oil', quantity: 1, unit: 'L', price: 180 },
          { id: 3, name: 'Tata Salt', quantity: 1, unit: 'kg', price: 25 },
        ]);
      }, 2000);
    } else {
      setIsRecording(true);
      setExtractedItems([]);
      // Simulate real-time transcript
      let currentText = "5 kg atta, ek packet tel, aur ek packet namak...";
      let i = 0;
      setTranscript('');
      const interval = setInterval(() => {
        setTranscript(prev => prev + currentText.charAt(i));
        i++;
        if (i >= currentText.length) clearInterval(interval);
      }, 50);
    }
  };

  const total = extractedItems.reduce((acc, item) => acc + item.price, 0);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto"
    >
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center justify-center gap-3">
          <Sparkles className="w-6 h-6 text-emerald" />
          AI Voice Billing
        </h1>
        <p className="text-neutral-500 mt-2 text-lg">Speak naturally in Bengali or Hindi to generate a bill.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Voice Input */}
        <motion.div variants={cardHover} initial="rest" whileHover="hover" className="bg-off-white rounded-[24px] p-8 shadow-[var(--shadow-soft)] border border-soft-stone flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
          
          {/* Pulsing rings when recording */}
          <AnimatePresence>
            {isRecording && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="absolute w-40 h-40 bg-emerald/10 rounded-full"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "linear" }}
                  className="absolute w-40 h-40 bg-emerald/5 rounded-full"
                />
              </>
            )}
          </AnimatePresence>

          <button 
            onClick={toggleRecording}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isRecording ? 'bg-muted-red text-warm-ivory scale-110' : 'bg-emerald text-warm-ivory hover:scale-105'
            }`}
          >
            {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </button>
          
          <p className="mt-8 text-neutral-500 font-medium">
            {isRecording ? "Listening..." : "Tap to speak"}
          </p>

          <div className="w-full mt-6 px-6 py-4 bg-warm-ivory rounded-2xl min-h-[100px] border border-soft-stone">
            {transcript ? (
              <p className="text-neutral-800 text-lg leading-relaxed">{transcript}</p>
            ) : (
              <p className="text-neutral-400 text-center italic">Transcript will appear here...</p>
            )}
          </div>
        </motion.div>

        {/* Right Column: Extracted Bill Preview */}
        <motion.div variants={cardHover} initial="rest" whileHover="hover" className="bg-off-white rounded-[24px] p-8 shadow-[var(--shadow-soft)] border border-soft-stone flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
            Bill Preview
            {isExtracting && <Loader2 className="w-5 h-5 text-emerald animate-spin" />}
          </h2>

          {!isExtracting && extractedItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
              <ReceiptText className="w-12 h-12 mb-4 opacity-20" strokeWidth={1} />
              <p>No items extracted yet.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <AnimatePresence>
                  {extractedItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-4 bg-warm-ivory rounded-xl border border-soft-stone/50 group"
                    >
                      <div>
                        <p className="font-semibold text-neutral-800">{item.name}</p>
                        <p className="text-sm text-neutral-500">{item.quantity} {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">₹{item.price}</span>
                        <button className="text-neutral-300 hover:text-muted-red opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {extractedItems.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 pt-6 border-t border-soft-stone"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-neutral-500 font-medium">Total Amount</span>
                    <span className="text-3xl font-bold text-forest-green">₹{total}</span>
                  </div>
                  
                  <div className="flex gap-4">
                    <button className="flex-1 py-3 px-4 rounded-xl font-medium border border-soft-stone hover:bg-soft-stone/30 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                    <button className="flex-1 py-3 px-4 rounded-xl font-medium bg-forest-green text-warm-ivory hover:bg-forest-green/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-forest-green/20">
                      <Check className="w-4 h-4" /> Save Bill
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
