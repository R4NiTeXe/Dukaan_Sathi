'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { Mic, MicOff, Check, X, Loader2, Sparkles, Plus, ReceiptText } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import AIStatusNotice from '@/components/ui/AIStatusNotice';
import { LANGUAGES, CATEGORIES } from '@/constants/navigation';
import Button from '@/components/ui/Button';
import RecentBills from '@/components/billing/RecentBills';
import PriceUpdateModal from '@/components/billing/PriceUpdateModal';
import AmbiguousProductModal from '@/components/billing/AmbiguousProductModal';

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
};

export default function VoiceBilling() {
  const { user } = useAuth();
  const [language, setLanguage] = useState(user?.preferredLanguage || 'en');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [micError, setMicError] = useState('');
  const [extractError, setExtractError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [ambiguousItem, setAmbiguousItem] = useState(null);
  const [priceChanges, setPriceChanges] = useState([]);
  const [showPriceUpdateModal, setShowPriceUpdateModal] = useState(false);
  const [updatingDefaults, setUpdatingDefaults] = useState(false);
  const [savedNewCount, setSavedNewCount] = useState(0);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef('');
  const pendingExtractRef = useRef(false);
  const manualStopRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
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
    const tokens = (text || '').split(/\s+/).filter(Boolean);
    let changed = true;
    while (changed) {
      changed = false;
      for (let w = 1; w <= 6 && !changed; w++) {
        for (let i = 0; i + w * 2 <= tokens.length; i++) {
          let match = true;
          for (let k = 0; k < w; k++) {
            if (tokens[i + k] !== tokens[i + w + k]) {
              match = false;
              break;
            }
          }
          if (match) {
            tokens.splice(i + w, w);
            changed = true;
            break;
          }
        }
      }
    }
    return tokens.join(' ');
  };

  const extractItemsFromTranscript = useCallback(async (text) => {
    if (extractInFlightRef.current) return;
    extractInFlightRef.current = true;
    const source = cleanTranscript(text ?? '').trim();
    if (!source) {
      extractInFlightRef.current = false;
      pendingExtractRef.current = false;
      setExtractError('No speech captured. Try speaking again or type the items manually.');
      return;
    }

    setIsExtracting(true);
    setExtractError('');
    try {
      const response = await api.post('/billing/extract', {
        transcript: source,
        language: languageRef.current,
      });
      if (response.data.success) {
        if (!response.data.data.items || response.data.data.items.length === 0) {
          setExtractError('No items could be recognized. Try speaking item names clearly.');
        } else {
          setExtractedItems(response.data.data.items);
          // Ask for clarification when an item matches several catalog products.
          const firstAmbiguous = (response.data.data.items || []).find(
            (item) => item.match === 'ambiguous'
          );
          setAmbiguousItem(firstAmbiguous || null);
        }
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setExtractError("Couldn't reach the server. Check your internet connection and try again.");
      } else if (err.response.status === 502 || err.response.status === 503) {
        setExtractError('The AI service is temporarily unavailable. Please try again in a moment.');
      } else if (err.response.status === 429) {
        setExtractError('Too many requests. Please wait a few seconds and try again.');
      } else {
        setExtractError(err.response?.data?.message || 'Failed to extract items from voice');
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
    recognition.lang = LANG_MAP[languageRef.current] || 'en-IN';

    recognition.onresult = (event) => {
      // Fresh results array after a session restart: resultIndex resets to 0,
      // which can never happen mid-session (indices below our cursor are final
      // and finals never change). The length check covers the reverse edge.
      if (
        event.resultIndex < lastResultIndexRef.current ||
        event.results.length < seenResultsRef.current
      ) {
        lastResultIndexRef.current = 0;
        seenResultsRef.current = 0;
      }
      seenResultsRef.current = event.results.length;

      let interim = '';
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
      setMicError('');
      setIsPaused(false);
    };

    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone permission was denied. Allow mic access and try again.',
        'service-not-allowed': 'Microphone access is blocked in your browser settings.',
        'no-speech': 'No speech detected. Please speak louder or check your microphone.',
        'audio-capture': 'No microphone found. Check that a microphone is connected.',
        network: 'Speech recognition service could not be reached. Check your internet connection.',
        aborted: '',
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
          interimTranscriptRef.current = '';
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
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return true; // older browsers: let SpeechRecognition handle the prompt
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.warn('Microphone permission denied:', err);
      return false;
    }
  }, []);

  const startRecognition = useCallback(async () => {
    if (!SpeechRecognition) return false;
    if (!sessionActiveRef.current) return false;
    setMicError('');
    if (!window.isSecureContext) {
      setMicError(
        'Voice recognition requires a secure connection (HTTPS or localhost). Connect via HTTPS and try again.'
      );
      return false;
    }
    const permitted = await ensureMicPermission();
    // The user may have tapped stop while the permission prompt was open.
    if (!permitted) {
      sessionActiveRef.current = false;
      setMicError(
        'Microphone permission was denied. Allow mic access in your browser and try again.'
      );
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
      console.warn('SpeechRecognition start failed:', err);
      sessionActiveRef.current = false;
      setIsRecording(false);
      setMicError('Could not start the microphone. Tap the mic again to retry.');
      return false;
    }
  }, [SpeechRecognition, ensureMicPermission, createRecognition]);

  // Auto-start if navigated with ?autoStart=true (home screen "Start Billing").
  // No artificial delay: start is attempted immediately, and a failed start
  // falls back to the paused state instead of leaving a stuck UI.
  useEffect(() => {
    if (typeof window === 'undefined' || !SpeechRecognition) return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoStart') !== 'true') return;
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
      setMicError(
        "Speech recognition isn't supported in this browser. You can still type the transcript below."
      );
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
          console.warn('Could not stop recognition normally', e);
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
      setTranscript('');
      setExtractedItems([]);
      setSaveError('');
      setExtractError('');
      setMicError('');
      latestTranscriptRef.current = '';
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
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
    setSaveError('');
    try {
      const payload = {
        items: extractedItems.map((item) => {
          const quantity = Number(item.quantity) || 1;
          return {
            productName: item.productName || item.name,
            quantity,
            unit: item.unit || 'piece',
            price: Number(item.price) || 0,
            pricePerUnit: item.pricePerUnit === true,
            matchedProductId: item.matchedProductId,
            // New products with a confirmed price get learned into the catalog.
            isNewConfirmed: item.match === 'new' && (Number(item.price) || 0) > 0,
            category: item.match === 'new' ? item.category || user?.shopType || 'other' : undefined,
            taxRate: item.match === 'new' ? Number(item.taxRate) || 0 : undefined,
          };
        }),
        paymentMethod,
        paymentStatus,
      };
      const response = await api.post('/billing/save', payload);
      if (response.data.success) {
        // Detect catalog items billed at a different price -> ask to update default.
        const changed = extractedItems
          .filter((item) => item.matchedProductId && Number(item.catalogUnitPrice) > 0)
          .map((item) => {
            const quantity = Number(item.quantity) || 1;
            const newUnitPrice = round2((Number(item.price) || 0) / quantity);
            return {
              item,
              newUnitPrice,
              oldUnitPrice: Number(item.catalogUnitPrice),
            };
          })
          .filter(({ newUnitPrice, oldUnitPrice }) =>
            Math.abs(newUnitPrice - oldUnitPrice) > 0.005
          );
        if (changed.length > 0) {
          setPriceChanges(
            changed.map(({ item, newUnitPrice, oldUnitPrice }) => ({
              productId: item.matchedProductId,
              name: item.catalogName || item.productName,
              unit: item.catalogUnit || item.unit,
              oldPrice: oldUnitPrice,
              newPrice: newUnitPrice,
            }))
          );
          setShowPriceUpdateModal(true);
        } else {
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 3000);
        }

        pausedRef.current = false;
        setTranscript('');
        setExtractedItems([]);
        setPaymentMethod('cash');
        setPaymentStatus('paid');
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setSaveError("Couldn't reach the server. Check your internet connection and try again.");
      } else if (err.response.status === 502 || err.response.status === 503) {
        setSaveError('The server is temporarily unavailable. Please try again in a moment.');
      } else if (err.response.status === 429) {
        setSaveError('Too many requests. Please wait a few seconds and try again.');
      } else {
        setSaveError(err.response?.data?.message || 'Failed to save bill');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const confirmPriceUpdates = async () => {
    if (priceChanges.length === 0) {
      setShowPriceUpdateModal(false);
      return;
    }
    setUpdatingDefaults(true);
    try {
      await Promise.all(
        priceChanges.map((change) =>
          api.put(`/products/${change.productId}`, { price: change.newPrice })
        )
      );
      setShowPriceUpdateModal(false);
      setPriceChanges([]);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error(err);
      setSaveError('Bill saved, but updating the default price failed.');
    } finally {
      setUpdatingDefaults(false);
    }
  };

  const removeItem = (idxToRemove) => {
    setExtractedItems((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const updateItem = (idx, field, value) => {
    setExtractedItems((prev) =>
      prev.map((item, i) => {
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
      })
    );
  };

  // Add a product from the Recent Bills quick-pick list. If the product is
  // already on the bill, its quantity grows instead of duplicating the line.
  const addRecentProduct = (product, qty) => {
    const addQty = Math.max(1, Number(qty) || 1);
    const unitPrice = Number(product.unitPrice) || 0;

    setExtractedItems((prev) => {
      const normalized = (name) => (name || '').trim().toLowerCase();
      const existingIdx = prev.findIndex(
        (entry) => normalized(entry.productName || entry.name) === normalized(product.productName)
      );
      if (existingIdx === -1) {
        return [
          ...prev,
          {
            productName: product.productName,
            quantity: addQty,
            unit: product.unit || 'piece',
            price: round2(unitPrice * addQty),
            pricePerUnit: false,
            match: 'catalog',
          },
        ];
      }
      return prev.map((entry, i) => {
        if (i !== existingIdx) return entry;
        const newQty = (Number(entry.quantity) || 0) + addQty;
        return {
          ...entry,
          quantity: newQty,
          price: round2(unitPrice * newQty),
          pricePerUnit: false,
        };
      });
    });
    setShowSuccessToast(false);
  };

  // Resolve an ambiguous (duplicate-name) item: pick a catalog candidate or
  // treat it as brand new. Continues prompting if more ambiguous items remain.
  const resolveAmbiguous = (item, candidate, asNew) => {
    setExtractedItems((prev) =>
      prev.map((entry, idx) => {
        if (entry !== item || !entry.ambiguous) return entry;
        if (asNew) {
          return { ...entry, match: 'new' };
        }
        const quantity = Number(entry.quantity) || 1;
        return {
          ...entry,
          match: 'catalog',
          matchedProductId: candidate._id,
          productName: candidate.name,
          catalogName: candidate.name,
          catalogUnit: candidate.unit,
          catalogUnitPrice: Number(candidate.price) || 0,
          unit: candidate.unit,
          price: round2((Number(candidate.price) || 0) * quantity),
          pricePerUnit: false,
        };
      })
    );
    const next = extractedItems.find(
      (entry) => entry !== item && entry.match === 'ambiguous'
    );
    setAmbiguousItem(next || null);
  };

  // Price/unit/category inputs for a newly recognized (not-yet-catalogued) item.
  const updateNewItem = (idx, field, value) => {
    setExtractedItems((prev) =>
      prev.map((entry, i) => (i === idx ? { ...entry, [field]: value } : entry))
    );
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
      className="relative mx-auto max-w-4xl min-w-0"
    >
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="text-warm-ivory fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          >
            <div className="bg-emerald/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="text-emerald h-4 w-4" />
            </div>
            <p className="font-medium">Bill saved successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AIStatusNotice />

      <header className="mb-8 text-center">
        <h1 className="font-heading flex items-center justify-center gap-3 text-3xl font-bold tracking-tight text-neutral-900">
          <Sparkles className="text-emerald h-6 w-6" />
          AI Voice Billing
        </h1>
        <p className="mt-2 text-lg text-neutral-500">
          Speak naturally to generate a bill, or type below.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column: Voice Input */}
        <motion.div
          variants={listItemVariants}
          className="bg-off-white border-soft-stone relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-2xl border p-6 shadow-[var(--shadow-soft)] sm:p-8"
        >
          {/* Pulsing rings when recording */}
          <AnimatePresence>
            {isRecording && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="bg-emerald/10 absolute h-40 w-40 rounded-full"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: 'linear' }}
                  className="bg-emerald/5 absolute h-40 w-40 rounded-full"
                />
              </>
            )}
          </AnimatePresence>

          <button
            onClick={toggleRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start voice billing'}
            className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-all ${
              isRecording
                ? 'bg-muted-red text-warm-ivory scale-110'
                : 'bg-emerald text-warm-ivory hover:scale-105'
            }`}
          >
            {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
          </button>

          <p className="mt-8 font-medium text-neutral-500">
            {isRecording
              ? 'Listening...'
              : isPaused
                ? 'Mic paused — tap to continue'
                : 'Tap to speak'}
          </p>

          {isPaused && !isRecording && (
            <p className="mt-3 max-w-xs rounded-xl border border-amber-200 bg-amber-100/70 px-4 py-2 text-center text-sm text-amber-700">
              Recording stopped on its own. Your transcript is safe — tap the mic to keep adding
              items to this bill.
            </p>
          )}

          {micError && !isRecording && (
            <p
              role="alert"
              className="bg-muted-red/10 border-muted-red/20 text-muted-red mt-3 max-w-xs rounded-xl border px-4 py-2 text-center text-sm"
            >
              {micError}
            </p>
          )}

          <div className="z-10 mt-4 flex items-center gap-2">
            <label htmlFor="voice-lang" className="text-sm text-neutral-500">
              Language:
            </label>
            <select
              id="voice-lang"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isRecording}
              className="bg-warm-ivory border-soft-stone focus:border-sage-green rounded-lg border px-3 py-1.5 text-sm text-neutral-700 transition-all focus:outline-none disabled:opacity-60"
            >
              {LANGUAGES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 w-full">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Transcript will appear here, or you can type manually..."
              className="bg-warm-ivory border-soft-stone focus:border-sage-green focus:ring-sage-green min-h-[100px] w-full resize-none rounded-2xl border px-6 py-4 transition-all focus:ring-1 focus:outline-none"
              rows={4}
            />
            {!isRecording && transcript && (
              <Button
                onClick={() => extractItemsFromTranscript(transcript)}
                loading={isExtracting}
                className="mt-2 w-full"
              >
                <Sparkles className="h-4 w-4" />
                {isExtracting ? 'Extracting...' : 'Extract Items'}
              </Button>
            )}
            {extractError && (
              <p
                role="alert"
                className="bg-muted-red/10 border-muted-red/20 text-muted-red mt-2 rounded-xl border px-4 py-2 text-center text-sm"
              >
                {extractError}
              </p>
            )}
          </div>
        </motion.div>

        {/* Right Column: Extracted Bill Preview */}
        <motion.div
          variants={listItemVariants}
          className="bg-off-white border-soft-stone flex flex-col rounded-2xl border p-6 shadow-[var(--shadow-soft)] sm:p-8"
        >
          <h2 className="mb-6 flex items-center justify-between text-xl font-bold">
            Bill Preview
            {isExtracting && <Loader2 className="text-emerald h-5 w-5 animate-spin" />}
          </h2>

          {!isExtracting && extractedItems.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-neutral-400">
              <ReceiptText className="mb-4 h-12 w-12 opacity-20" strokeWidth={1} />
              <p>No items extracted yet.</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="flex-1 space-y-4">
                <AnimatePresence>
                  {extractedItems.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-warm-ivory border-soft-stone group flex items-start justify-between gap-3 rounded-xl border p-3 sm:p-4"
                    >
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-semibold text-neutral-800">
                          {item.productName || item.name}
                          {item.match === 'new' && (
                            <span className="bg-muted-indigo/10 text-muted-indigo border-muted-indigo/20 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase">
                              New
                            </span>
                          )}
                          {item.match === 'catalog' && Number(item.catalogUnitPrice) > 0 && (
                            <span className="bg-emerald/10 text-emerald border-emerald/20 rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                              Saved ₹{item.catalogUnitPrice}/{item.catalogUnit}
                            </span>
                          )}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <label className="text-xs text-neutral-400">Qty</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            className="bg-off-white border-soft-stone focus:border-sage-green w-16 rounded-lg border px-2 py-1 text-sm text-neutral-700 focus:outline-none"
                          />
                          <label className="text-xs text-neutral-400">Price</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            value={item.price}
                            onChange={(e) => updateItem(idx, 'price', e.target.value)}
                            className={`w-20 rounded-lg border px-2 py-1 text-sm focus:outline-none ${
                              item.match === 'new' && (Number(item.price) || 0) <= 0
                                ? 'border-amber-300 bg-amber-50 text-amber-800 focus:border-amber-400'
                                : 'bg-off-white border-soft-stone focus:border-sage-green text-neutral-700'
                            }`}
                          />
                          {item.pricePerUnit && (
                            <span className="text-[10px] text-neutral-400">per {item.unit}</span>
                          )}
                        </div>

                        {/* First-time product: ask for price + category + tax once. */}
                        {item.match === 'new' && (Number(item.price) || 0) <= 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                              <Sparkles className="h-3 w-3" />
                              New product — set a price to add it to your catalog automatically.
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="text-[10px] text-neutral-400">Price ₹</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                placeholder="e.g. 20"
                                value={item.price || ''}
                                onChange={(e) => updateNewItem(idx, 'price', e.target.value)}
                                className="bg-off-white border-amber-300 focus:border-amber-400 w-24 rounded-lg border px-2 py-1 text-sm focus:outline-none"
                                aria-label={`Set price for ${item.productName}`}
                              />
                              <label className="text-[10px] text-neutral-400">Category</label>
                              <select
                                value={item.category || user?.shopType || 'other'}
                                onChange={(e) => updateNewItem(idx, 'category', e.target.value)}
                                className="bg-off-white border-soft-stone focus:border-sage-green rounded-lg border px-2 py-1 text-xs focus:outline-none"
                              >
                                {CATEGORIES.map((cat) => (
                                  <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </option>
                                ))}
                              </select>
                              <label className="text-[10px] text-neutral-400">Tax %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={item.taxRate ?? 0}
                                onChange={(e) => updateNewItem(idx, 'taxRate', e.target.value)}
                                className="bg-off-white border-soft-stone focus:border-sage-green w-16 rounded-lg border px-2 py-1 text-sm focus:outline-none"
                                aria-label="Tax rate percent"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">₹{lineTotal(item).toFixed(2)}</span>
                        <button
                          onClick={() => removeItem(idx)}
                          className="hover:text-muted-red text-neutral-300 transition-opacity"
                        >
                          <X className="h-4 w-4" />
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
                  className="border-soft-stone mt-6 border-t pt-6"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-medium text-neutral-500">Total Amount</span>
                    <span className="text-forest-green text-3xl font-bold">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>

                  {saveError && (
                    <p role="alert" className="text-muted-red mb-4 text-center text-sm">
                      {saveError}
                    </p>
                  )}

                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium tracking-wider text-neutral-500 uppercase">
                        Payment Mode
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="bg-off-white border-soft-stone focus:border-sage-green focus:ring-sage-green w-full rounded-xl border p-2.5 text-sm transition-all focus:ring-1 focus:outline-none"
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium tracking-wider text-neutral-500 uppercase">
                        Status
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="bg-off-white border-soft-stone focus:border-sage-green focus:ring-sage-green w-full rounded-xl border p-2.5 text-sm transition-all focus:ring-1 focus:outline-none"
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Unpaid (Pending)</option>
                      </select>
                    </div>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="mb-6">
                      {user?.upiQrCode ? (
                        <div className="bg-warm-ivory border-soft-stone flex flex-col items-center justify-center rounded-xl border p-4 shadow-sm">
                          <img
                            src={user.upiQrCode}
                            alt="Shop UPI QR Code"
                            className="aspect-square h-auto w-full max-w-[160px] rounded-lg object-cover"
                          />
                          <p className="mt-4 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                            Scan to Pay
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-indigo bg-muted-indigo/10 border-muted-indigo/20 rounded-lg border p-3 text-center text-xs">
                          No UPI QR code found. You can upload one in your Profile settings!
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button onClick={handleSaveBill} loading={isSaving} className="flex-1">
                      <Check className="h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save Bill'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <RecentBills onAddProduct={addRecentProduct} className="mt-8" />

      <AmbiguousProductModal
        item={ambiguousItem}
        onPick={(candidate, asNew) => resolveAmbiguous(ambiguousItem, candidate, asNew)}
        onClose={() => {
          setExtractedItems((prev) =>
            prev.map((entry) =>
              entry === ambiguousItem ? { ...entry, match: 'new' } : entry
            )
          );
          setAmbiguousItem(null);
        }}
      />
      <PriceUpdateModal
        open={showPriceUpdateModal}
        changes={priceChanges}
        onClose={() => {
          setShowPriceUpdateModal(false);
          setPriceChanges([]);
        }}
        onUpdatePrices={confirmPriceUpdates}
        updating={updatingDefaults}
      />
    </motion.div>
  );
}
