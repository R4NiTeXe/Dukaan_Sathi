'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/utils/animations';
import {
  BotMessageSquare,
  Send,
  Bot,
  User,
  FileText,
  TrendingUp,
  Users,
  AlertTriangle,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import api from '@/services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import AIStatusNotice from '@/components/ui/AIStatusNotice';
import Button from '@/components/ui/Button';

const presetQuestions = [
  {
    title: "Today's Summary",
    icon: FileText,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Top Products',
    icon: TrendingUp,
    color: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Pending Bills',
    icon: AlertTriangle,
    color: 'text-orange-500 dark:text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    title: 'Monthly Trend',
    icon: AlertTriangle,
    color: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-500/10',
  },
];

export default function AIAdvisor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getFriendlyError = (err) => {
    if (!err.response) {
      return "Couldn't reach the server. Please check your internet connection and try again.";
    }
    switch (err.response.status) {
      case 502:
      case 503:
        return 'The AI assistant is temporarily unavailable. Please try again in a moment.';
      case 429:
        return 'Too many requests right now. Please wait a few seconds and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      default:
        return (
          err.response?.data?.message ||
          'Sorry, I encountered an error while processing your request.'
        );
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await api.post('/assistant/ask', { question: text });
      if (response.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            content: response.data.data.answer,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: getFriendlyError(err),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="bg-off-white border-soft-stone mx-auto flex h-[calc(100dvh-140px)] max-w-6xl min-w-0 flex-col overflow-hidden rounded-2xl border shadow-[var(--shadow-soft)] md:h-[calc(100vh-120px)] md:flex-row"
    >
      {/* Left Sidebar - Removed Recent Chats since there's no backend for it, kept clear layout */}
      <div className="border-soft-stone bg-warm-ivory hidden w-72 flex-col border-r md:flex">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="text-purple-600">
              <Bot className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h2 className="leading-none font-bold text-neutral-900">AI Assistant</h2>
              <p className="mt-1 text-[11px] text-neutral-500">Your Business Advisor</p>
            </div>
          </div>
        </div>

        <div className="mt-4 px-6 py-4">
          <p className="text-sm leading-relaxed font-medium text-neutral-600">
            Your intelligent shop assistant, securely plugged into your live database. Gain insights
            into sales, track top-performing products, and discover your best customers instantly.
          </p>
        </div>

        <div className="mt-auto px-6 pb-6">
          <button
            onClick={() => setMessages([])}
            className="bg-off-white border-soft-stone text-forest-green hover:bg-forest-green/5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold transition-colors"
          >
            <Plus className="h-4 w-4" /> New Chat
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="bg-off-white relative flex min-h-0 flex-1 flex-col p-4 pb-0">
        <AIStatusNotice type="advisor" />

        {messages.length > 0 && (
          <div className="border-soft-stone/50 bg-off-white flex shrink-0 items-center justify-end border-b px-6 py-3">
            <button
              onClick={() => setMessages([])}
              className="text-muted-red hover:bg-muted-red/10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Clear Chat
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 md:px-8">
            <div className="min-h-[20px] flex-1"></div>

            <div className="mx-auto flex w-full max-w-xl shrink-0 flex-col items-center py-4 text-center">
              <div className="relative mb-6 h-20 w-20 shrink-0 md:h-24 md:w-24">
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent to-[#f5f3ef]/50 blur-xl"></div>
                <BotMessageSquare
                  className="text-sage-green/40 absolute z-10 h-full w-full drop-shadow-md"
                  strokeWidth={1}
                />
              </div>

              <h2 className="font-heading mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-neutral-900">
                Namaste! <Bot className="text-sage-green h-7 w-7" />
              </h2>
              <p className="mb-8 text-sm text-neutral-500">
                I&apos;m here to help you grow your business smarter.
              </p>

              <div className="w-full text-left">
                {/* Highlighted 'What I Can Do' Section */}
                <div className="from-forest-green/10 to-emerald/5 border-forest-green/20 relative mb-8 overflow-hidden rounded-2xl border-2 bg-gradient-to-br p-6 shadow-sm">
                  <div className="bg-forest-green/10 absolute -top-6 -right-6 h-32 w-32 rounded-full blur-3xl"></div>
                  <h3 className="text-forest-green mb-4 flex items-center gap-2 text-sm font-extrabold tracking-wider uppercase">
                    <Sparkles className="h-5 w-5" /> What I Can Do For You
                  </h3>
                  <ul className="list-inside list-disc space-y-2 text-[13px] leading-relaxed font-medium text-neutral-700 md:text-sm">
                    <li>
                      <span className="font-bold text-neutral-900">Analyze live data:</span> Sales,
                      bills, products, and customers.
                    </li>
                    <li>
                      <span className="font-bold text-neutral-900">Generate reports:</span> Daily
                      summaries, monthly trends, and performance.
                    </li>
                    <li>
                      <span className="font-bold text-neutral-900">Multilingual support:</span>{' '}
                      Converse smoothly in English, Hindi, or Bengali.
                    </li>
                  </ul>

                  <div className="border-forest-green/15 relative z-10 mt-5 border-t pt-4">
                    <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold tracking-widest text-neutral-800 uppercase">
                      <AlertCircle className="text-muted-red h-3.5 w-3.5" /> Limitations &
                      Expectations
                    </h4>
                    <p className="text-xs leading-relaxed font-medium text-neutral-600">
                      Please do not expect me to execute administrative tasks. I cannot create or
                      delete bills, alter your shop&apos;s database, or process payments. My purpose
                      is strictly to provide analytical insights and answer questions based on your
                      existing data.
                    </p>
                  </div>
                </div>

                <p className="mb-3 px-1 text-[13px] font-bold tracking-wide text-neutral-800 uppercase">
                  Try asking me
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {presetQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q.title)}
                      aria-label={`Ask: ${q.title}`}
                      className="bg-off-white border-soft-stone hover:border-sage-green flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-left transition-all hover:shadow-sm"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${q.bg} ${q.color}`}
                      >
                        <q.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[13px] leading-tight font-bold text-neutral-800">
                        {q.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="min-h-[20px] flex-1"></div>
          </div>
        ) : (
          /* Chat History */
          <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex max-w-[85%] flex-col ${msg.role === 'user' ? 'ml-auto items-end' : 'items-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="bg-sage-green/10 border-sage-green/20 rounded-2xl rounded-tr-sm border px-5 py-3 text-[14px] text-neutral-900">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="bg-forest-green mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                        <Bot className="text-warm-ivory h-4 w-4" />
                      </div>
                      <div className="bg-warm-ivory border-soft-stone prose prose-sm prose-p:leading-relaxed prose-pre:bg-neutral-100 prose-pre:text-neutral-800 prose-strong:text-neutral-900 prose-strong:font-semibold max-w-none rounded-2xl rounded-tl-sm border px-5 py-3 text-[14px] text-neutral-800 shadow-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex max-w-[80%] gap-3"
              >
                <div className="bg-forest-green text-warm-ivory mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-warm-ivory border-soft-stone flex items-center gap-1 rounded-2xl rounded-tl-sm border px-5 py-4 text-neutral-500 shadow-sm">
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="bg-off-white mt-auto shrink-0 p-4 pb-32 md:p-6 md:pb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="relative flex w-full items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your business..."
              className="bg-warm-ivory border-soft-stone focus:border-forest-green/30 focus:ring-forest-green/5 w-full rounded-2xl border py-4 pr-14 pl-6 text-[14px] transition-all focus:ring-4 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-3 cursor-pointer rounded-xl bg-[#4c7c5b] p-2.5 text-white shadow-sm transition-colors hover:bg-[#3d654a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
