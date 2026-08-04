"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import AIStatusNotice from '@/components/ui/AIStatusNotice';
import { LANGUAGES } from '@/constants/navigation';
import Button from '@/components/ui/Button';

const LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
};

export default function VoiceBilling() {
  const { user } = useAuth();
  const [language, setLanguage] = useState(user?.preferredLanguage || "en");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [micError, setMicError] = useState("");
  const [extractError, setExtractError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const SpeechRecognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef("");
  const pendingExtractRef = useRef(false);
  const manualStopRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const lastResultIndexRef = useRef(0);
  const seenResultsRef = useRef(0);
  const languageRef = useRef(language);
  const pausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  // True while the user intends a session to be live (covers the async window
  // while the mic permission prompt is resolving — prevents a quick stop tap
  // from accidentally starting a second, duplicate session).
  const sessionActiveRef = useRef(false);
  const extractInFlightRef = useRef(false);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const cleanTranscript = (text) => {
    const tokens = (text || "").split(/\s+/).filter(Boolean);
    let changed = true;
    while (changed) {
      changed = false;
      for (let w = 1; w <= 6 && !changed; w++) {
        for (let i = 0; i + w * 2 <= tokens.length; i++) {
          let match = true;
          for (let k = 0; k < w; k++) {
            if (tokens[i + k] !== tokens[i + w + k]) { match = false; break; }
          }
          if (match) {
            tokens.splice(i + w, w);
            changed = true;
            break;
          }
        }
      }
    }
    return tokens.join(" ");
  };

  const extractItemsFromTranscript = useCallback(async (text) => {
    if (extractInFlightRef.current) return;
    extractInFlightRef.current = true;
    const source = cleanTranscript(text ?? "").trim();
    if (!source) {
      extractInFlightRef.current = false;
      pendingExtractRef.current = false;
      setExtractError("No speech captured. Try speaking again or type the items manually.");
      return;
    }

    setIsExtracting(true);
    setExtractError("");
    try {
      const response = await api.post("/billing/extract", {
        transcript: source,
        language: languageRef.current,
      });
      if (response.data.success) {
        if (!response.data.data.items || response.data.data.items.length === 0) {
          setExtractError("No items could be recognized. Try speaking item names clearly.");
        } else {
          setExtractedItems(response.data.data.items);
        }
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setExtractError("Couldn't reach the server. Check your internet connection and try again.");
      } else if (err.response.status === 502 || err.response.status === 503) {
        setExtractError("The AI service is temporarily unavailable. Please try again in a moment.");
      } else if (err.response.status === 429) {
        setExtractError("Too many requests. Please wait a few seconds and try again.");
      } else {
        setExtractError(err.response?.data?.message || "Failed to extract items from voice");
      }
    } finally {
      extractInFlightRef.current = false;
      setIsExtracting(false);
    }
  }, []);

  // The Web Speech API requires a secure context (HTTPS, or localhost).
  // Accessing the app over a plain http:// LAN address (common on Android
  // phones) makes SpeechRecognition undefined or silently blocked.

  // Chrome (Windows/Android) keeps a stale instance alive after stop()/onend:
  // reusing it for a new session silently drops results or throws
  // InvalidStateError. Safari tolerates reuse, but every browser behaves
  // correctly with a FRESH instance per start.
  const createRecognition = useCallback(() => {
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = LANG_MAP[languageRef.current] || "en-IN";

    recognition.onresult = (event) => {
      // Fresh results array after a session restart: resultIndex resets to 0,
      // which can never happen mid-session (indices below our cursor are final
      // and finals never change). The length check covers the reverse edge.
      if (event.resultIndex < lastResultIndexRef.current || event.results.length < seenResultsRef.current) {
        lastResultIndexRef.current = 0;
        seenResultsRef.current = 0;
      }
      seenResultsRef.current = event.results.length;

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += ` ${result[0].transcript}`;
          lastResultIndexRef.current = i + 1;
        } else {
          interim += result[0].transcript;
        }
      }
      interimTranscriptRef.current = interim;
      const combined = cleanTranscript(`${finalTranscriptRef.current} ${interim}`.trim());
      latestTranscriptRef.current = combined;
      setTranscript(combined);
      setMicError("");
      setIsPaused(false);
    };

    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone permission was denied. Allow mic access and try again.',
        'service-not-allowed': 'Microphone access is blocked in your browser settings.',
        'no-speech': 'No speech detected. Please speak louder or check your microphone.',
        'audio-capture': 'No microphone found. Check that a microphone is connected.',
        'network': 'Speech recognition service could not be reached. Check your internet connection.',
        'aborted': '',
        'invalid-state': 'The microphone could not start. Tap the mic again to retry.',
      };
      setMicError(messages[event.error] || `Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsRecording(false);
      sessionActiveRef.current = false;
      recognitionRef.current = null; // always force a fresh instance next start
      if (manualStopRef.current) {
        manualStopRef.current = false;
        pausedRef.current = false;
        setIsPaused(false);
        if (pendingExtractRef.current) {
          pendingExtractRef.current = false;
          extractItemsFromTranscript(latestTranscriptRef.current);
        }
      } else {
        // Session ended on its own (silence, tab switch, service hiccup).
        // Never auto-restart — that re-captures leftover mic audio and
        // duplicates the last phrase on mobile. Keep the transcript safe
        // and let the user tap the mic to continue adding items.
        if (interimTranscriptRef.current.trim()) {
          finalTranscriptRef.current += ` ${interimTranscriptRef.current}`;
          finalTranscriptRef.current = cleanTranscript(finalTranscriptRef.current);
          interimTranscriptRef.current = "";
          setTranscript(finalTranscriptRef.current);
        }
        pausedRef.current = true;
        setIsPaused(true);
      }
    };

    return recognition;
  }, [SpeechRecognition, extractItemsFromTranscript]);

  // Chrome/Edge on Windows and Android only shows the mic prompt reliably via
  // getUserMedia. Preflight it so the user is prompted once, cleanly, before
  // SpeechRecognition starts — otherwise first-run sessions can fail with
  // 'not-allowed' or hang on Android.
  const ensureMicPermission = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return true; // older browsers: let SpeechRecognition handle the prompt
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.warn("Microphone permission denied:", err);
      return false;
    }
  }, []);

  const startRecognition = useCallback(async () => {
    if (!SpeechRecognition) return false;
    if (!sessionActiveRef.current) return false;
    setMicError("");
    if (!window.isSecureContext) {
      setMicError("Voice recognition requires a secure connection (HTTPS or localhost). Connect via HTTPS and try again.");
      return false;
    }
    const permitted = await ensureMicPermission();
    // The user may have tapped stop while the permission prompt was open.
    if (!permitted) {
      sessionActiveRef.current = false;
      setMicError("Microphone permission was denied. Allow mic access in your browser and try again.");
      return false;
    }
    if (!sessionActiveRef.current) return false;
    try {
      const recognition = createRecognition();
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      return true;
    } catch (err) {
      console.warn("SpeechRecognition start failed:", err);
      sessionActiveRef.current = false;
      setIsRecording(false);
      setMicError("Could not start the microphone. Tap the mic again to retry.");
      return false;
    }
  }, [SpeechRecognition, ensureMicPermission, createRecognition]);

  // Auto-start if navigated with ?autoStart=true (home screen "Start Billing").
  // No artificial delay: start is attempted immediately, and a failed start
  // falls back to the paused state instead of leaving a stuck UI.
  useEffect(() => {
    if (typeof window === "undefined" || !SpeechRecognition) return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("autoStart") !== "true") return;
    sessionActiveRef.current = true;
    startRecognition().then((started) => {
      if (started) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });
  }, [SpeechRecognition, startRecognition]);

  const handleLanguageChange = (value) => {
    setLanguage(value);
    if (recognitionRef.current) {
      recognitionRef.current.lang = LANG_MAP[value] || 'en-IN';
    }
  };

  const toggleRecording = () => {
    if (!SpeechRecognition) {
      setMicError("Speech recognition isn't supported in this browser. You can still type the transcript below.");
      return;
    }

    if (isRecording || sessionActiveRef.current) {
      // Stop intent — also covers the window while the mic permission prompt
      // is still resolving (isRecording is not yet true).
      sessionActiveRef.current = false;
      if (isRecording) {
        manualStopRef.current = true;
        pendingExtractRef.current = true;
        setIsRecording(false); // Update UI immediately to prevent getting stuck

        try {
          recognitionRef.current?.stop();
        } catch (e) {
          console.warn("Could not stop recognition normally", e);
        }

        // Mobile Fallback: If the browser's onend event fails to fire, force the extraction
        setTimeout(() => {
          if (pendingExtractRef.current) {
            pendingExtractRef.current = false;
            manualStopRef.current = false;
            pausedRef.current = false;
            setIsPaused(false);
            extractItemsFromTranscript(latestTranscriptRef.current);
          }
        }, 1500);
      }
      return;
    }

    // Continuing after a paused session keeps the accumulated transcript;
    // a fresh session clears everything.
    if (!pausedRef.current) {
      setTranscript("");
      setExtractedItems([]);
      setSaveError("");
      setExtractError("");
      setMicError("");
      latestTranscriptRef.current = "";
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      lastResultIndexRef.current = 0;
      seenResultsRef.current = 0;
    }
    pausedRef.current = false;
    setIsPaused(false);
    sessionActiveRef.current = true;
    startRecognition();
  };

  const handleSaveBill = async () => {
    if (extractedItems.length === 0) return;
    
    setIsSaving(true);
    setSaveError("");
    try {
      const payload = {
        items: extractedItems.map(item => ({
          productName: item.productName || item.name, // Fallback if name is returned
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'piece',
          price: Number(item.price) || 0,
          pricePerUnit: item.pricePerUnit === true
        })),
        paymentMethod,
        paymentStatus
      };
      const response = await api.post("/billing/save", payload);
      if (response.data.success) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        pausedRef.current = false;
        setTranscript("");
        setExtractedItems([]);
        setPaymentMethod("cash");
        setPaymentStatus("paid");
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setSaveError("Couldn't reach the server. Check your internet connection and try again.");
      } else if (err.response.status === 502 || err.response.status === 503) {
        setSaveError("The server is temporarily unavailable. Please try again in a moment.");
      } else if (err.response.status === 429) {
        setSaveError("Too many requests. Please wait a few seconds and try again.");
      } else {
        setSaveError(err.response?.data?.message || "Failed to save bill");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = (idxToRemove) => {
    setExtractedItems(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const updateItem = (idx, field, value) => {
    setExtractedItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      
      const updatedItem = { ...item };
      
      if (field === 'productName') {
        updatedItem.productName = value;
      } else {
        // Auto-scale price if quantity changes and pricePerUnit is false
        if (field === 'quantity' && !item.pricePerUnit) {
          const oldQty = Number(item.quantity) || 1;
          const newQty = Number(value) || 0;
          const currentPrice = Number(item.price) || 0;
          if (oldQty > 0) {
            const unitPrice = currentPrice / oldQty;
            updatedItem.price = Number((unitPrice * newQty).toFixed(2));
          }
        }
        // Store as string to prevent "0" prefix bugs when typing
        updatedItem[field] = value;
      }
      return updatedItem;
    }));
  };

  const lineTotal = (item) => {
    const p = Number(item.price) || 0;
    const q = Number(item.quantity) || 0;
    return item.pricePerUnit ? p * q : p;
  };

  const total = extractedItems.reduce((acc, item) => acc + lineTotal(item), 0);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto min-w-0 relative"
    >
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-neutral-900 text-warm-ivory rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-800"
          >
            <div className="w-8 h-8 rounded-full bg-emerald/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-emerald" />
            </div>
            <p className="font-medium">Bill saved successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AIStatusNotice />

      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center justify-center gap-3 font-heading">
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
            {isRecording ? "Listening..." : isPaused ? "Mic paused — tap to continue" : "Tap to speak"}
          </p>

          {isPaused && !isRecording && (
            <p className="mt-3 px-4 py-2 bg-amber-100/70 border border-amber-200 rounded-xl text-amber-700 text-sm text-center max-w-xs">
              Recording stopped on its own. Your transcript is safe — tap the mic to keep adding items to this bill.
            </p>
          )}

          {micError && !isRecording && (
            <p className="mt-3 px-4 py-2 bg-muted-red/10 border border-muted-red/20 rounded-xl text-muted-red text-sm text-center max-w-xs">
              {micError}
            </p>
          )}

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
              {LANGUAGES.map((opt) => (
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
              <Button 
                onClick={() => extractItemsFromTranscript(transcript)}
                loading={isExtracting}
                className="w-full mt-2"
              >
                <Sparkles className="w-4 h-4" />
                {isExtracting ? "Extracting..." : "Extract Items"}
              </Button>
            )}
            {extractError && (
              <p className="mt-2 px-4 py-2 bg-muted-red/10 border border-muted-red/20 rounded-xl text-muted-red text-sm text-center">
                {extractError}
              </p>
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
                        <div className="flex items-center gap-2 mt-1.5">
                          <label className="text-xs text-neutral-400">Qty</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            className="w-16 px-2 py-1 bg-off-white border border-soft-stone rounded-lg text-sm text-neutral-700 focus:outline-none focus:border-sage-green"
                          />
                          <label className="text-xs text-neutral-400">Price</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.price}
                            onChange={(e) => updateItem(idx, 'price', e.target.value)}
                            className="w-20 px-2 py-1 bg-off-white border border-soft-stone rounded-lg text-sm text-neutral-700 focus:outline-none focus:border-sage-green"
                          />
                          {item.pricePerUnit && (
                            <span className="text-[10px] text-neutral-400">per {item.unit}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">₹{lineTotal(item).toFixed(2)}</span>
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

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Payment Mode</label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Status</label>
                      <select 
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-full p-2.5 bg-off-white border border-soft-stone rounded-xl text-sm focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all"
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Unpaid (Pending)</option>
                      </select>
                    </div>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="mb-6">
                      {user?.upiQrCode ? (
                        <div className="flex flex-col items-center justify-center p-4 bg-warm-ivory rounded-xl border border-soft-stone shadow-sm">
                          <img 
                            src={user.upiQrCode} 
                            alt="Shop UPI QR Code" 
                            className="w-full max-w-[160px] h-auto aspect-square object-cover rounded-lg"
                          />
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-4">Scan to Pay</p>
                        </div>
                      ) : (
                        <p className="text-muted-indigo text-xs text-center p-3 bg-muted-indigo/10 rounded-lg border border-muted-indigo/20">
                          No UPI QR code found. You can upload one in your Profile settings!
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button 
                      onClick={handleSaveBill}
                      loading={isSaving}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4" />
                      {isSaving ? "Saving..." : "Save Bill"}
                    </Button>
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
