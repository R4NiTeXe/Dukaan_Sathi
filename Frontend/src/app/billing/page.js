"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, cardHover, listItemVariants } from "@/utils/animations";
import {
  Mic,
  MicOff,
  Check,
  X,
  Loader2,
  Sparkles,
  Plus,
  ReceiptText,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-BD",
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
];

export default function VoiceBilling() {
  const { user } = useAuth();
  const [language, setLanguage] = useState(user?.preferredLanguage || "en");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const SpeechRecognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = LANG_MAP[user?.preferredLanguage] || 'en-IN';

      recognition.onresult = (event) => {
        let currentTrans = '';
        for (let i = 0; i < event.results.length; ++i) {
          currentTrans += event.results[i][0].transcript;
        }
        setTranscript(currentTrans);
      };

      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;

      // Auto-start if navigated with ?autoStart=true
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('autoStart') === 'true') {
          // Small delay to ensure UI is ready
          setTimeout(() => {
            recognition.start();
            setIsRecording(true);
            // Clean up URL so it doesn't auto-start on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
          }, 500);
        }
      }
    }
  }, [SpeechRecognition, user?.preferredLanguage]);

  const handleLanguageChange = (value) => {
    setLanguage(value);
    if (recognitionRef.current) {
      recognitionRef.current.lang = LANG_MAP[value] || 'en-IN';
    }
  };

  const toggleRecording = () => {
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please type the transcript manually.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      extractItemsFromTranscript();
    } else {
      setTranscript("");
      setExtractedItems([]);
      setSaveError("");
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const extractItemsFromTranscript = async () => {
    if (!transcript.trim()) return;
    
    setIsExtracting(true);
    try {
      const response = await api.post("/billing/extract", { transcript: transcript.trim() });
      if (response.data.success) {
        setExtractedItems(response.data.data.items);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to extract items from voice");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveBill = async () => {
    if (extractedItems.length === 0) return;
    
    setIsSaving(true);
    setSaveError("");
    try {
      const payload = {
        items: extractedItems.map(item => ({
          productName: item.productName || item.name, // Fallback if name is returned
          quantity: item.quantity || 1,
          unit: item.unit || 'piece',
          price: item.price || 0
        })),
        paymentMethod: 'cash', // Default to cash for voice billing
        paymentStatus: 'paid'
      };
      const response = await api.post("/billing/save", payload);
      if (response.data.success) {
        alert("Bill saved successfully!");
        setTranscript("");
        setExtractedItems([]);
      }
    } catch (err) {
      console.error(err);
      setSaveError(err.response?.data?.message || "Failed to save bill");
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = (idxToRemove) => {
    setExtractedItems(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const total = extractedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto min-w-0"
    >
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center justify-center gap-3">
          <Sparkles className="w-6 h-6 text-emerald" />
          AI Voice Billing
        </h1>
        <p className="text-neutral-500 mt-2 text-lg">
          Speak naturally to generate a bill, or type below.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Voice Input */}
        <motion.div
          variants={cardHover}
          initial="rest"
          whileHover="hover"
          className="bg-off-white rounded-[24px] p-8 shadow-[var(--shadow-soft)] border border-soft-stone flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden"
        >
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
              isRecording
                ? "bg-muted-red text-warm-ivory scale-110"
                : "bg-emerald text-warm-ivory hover:scale-105"
            }`}
          >
            {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </button>

          <p className="mt-8 text-neutral-500 font-medium">
            {isRecording ? "Listening..." : "Tap to speak"}
          </p>

          <div className="mt-4 flex items-center gap-2 z-10">
            <label htmlFor="voice-lang" className="text-sm text-neutral-500">
              Language:
            </label>
            <select
              id="voice-lang"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isRecording}
              className="px-3 py-1.5 bg-warm-ivory border border-soft-stone rounded-lg text-sm focus:outline-none focus:border-sage-green transition-all text-neutral-700 disabled:opacity-60"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full mt-6">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Transcript will appear here, or you can type manually..."
              className="w-full px-6 py-4 bg-warm-ivory rounded-2xl min-h-[100px] border border-soft-stone resize-none focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
              rows={4}
            />
            {!isRecording && transcript && (
              <button 
                onClick={extractItemsFromTranscript}
                disabled={isExtracting}
                className="w-full mt-2 py-2 bg-sage-green text-forest-green rounded-xl font-medium hover:bg-sage-green/80 transition-colors flex justify-center items-center gap-2"
              >
                {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isExtracting ? "Extracting..." : "Extract Items"}
              </button>
            )}
          </div>
        </motion.div>

        {/* Right Column: Extracted Bill Preview */}
        <motion.div
          variants={cardHover}
          initial="rest"
          whileHover="hover"
          className="bg-off-white rounded-[24px] p-8 shadow-[var(--shadow-soft)] border border-soft-stone flex flex-col"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
            Bill Preview
            {isExtracting && (
              <Loader2 className="w-5 h-5 text-emerald animate-spin" />
            )}
          </h2>

          {!isExtracting && extractedItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
              <ReceiptText
                className="w-12 h-12 mb-4 opacity-20"
                strokeWidth={1}
              />
              <p>No items extracted yet.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4">
                <AnimatePresence>
                  {extractedItems.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-4 bg-warm-ivory rounded-xl border border-soft-stone group"
                    >
                      <div>
                        <p className="font-semibold text-neutral-800">
                          {item.productName || item.name}
                        </p>
                        <p className="text-sm text-neutral-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                        <button 
                          onClick={() => removeItem(idx)}
                          className="text-neutral-300 hover:text-muted-red transition-opacity"
                        >
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
                    <span className="text-neutral-500 font-medium">
                      Total Amount
                    </span>
                    <span className="text-3xl font-bold text-forest-green">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>

                  {saveError && (
                    <p className="text-muted-red text-sm mb-4 text-center">{saveError}</p>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={handleSaveBill}
                      disabled={isSaving}
                      className="flex-1 py-3 px-4 rounded-xl font-medium bg-forest-green text-warm-ivory hover:bg-forest-green/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-forest-green/20"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {isSaving ? "Saving..." : "Save Bill"}
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
