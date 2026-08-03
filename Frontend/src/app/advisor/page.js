'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/utils/animations';
import { 
  BotMessageSquare, Send, Bot, User, 
  FileText, TrendingUp, Users, AlertTriangle, AlertCircle, Plus, Trash2, Sparkles
} from 'lucide-react';
import api from '@/services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import AIStatusNotice from '@/components/ui/AIStatusNotice';

const presetQuestions = [
  { title: "Today's Summary", icon: FileText, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10" },
  { title: "Top Products", icon: TrendingUp, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-500/10" },
  { title: "Pending Bills", icon: AlertTriangle, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10" },
  { title: "Monthly Trend", icon: AlertTriangle, color: "text-red-500 dark:text-red-400", bg: "bg-red-500/10" }
];

export default function AIAdvisor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getFriendlyError = (err) => {
    if (!err.response) {
      return "Couldn't reach the server. Please check your internet connection and try again.";
    }
    switch (err.response.status) {
      case 502:
      case 503:
        return "The AI assistant is temporarily unavailable. Please try again in a moment.";
      case 429:
        return "Too many requests right now. Please wait a few seconds and try again.";
      case 401:
        return "Your session has expired. Please log in again.";
      default:
        return err.response?.data?.message || "Sorry, I encountered an error while processing your request.";
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await api.post('/assistant/ask', { question: text });
      if (response.data.success) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: response.data.data.answer
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: getFriendlyError(err)
      }]);
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
      className="max-w-6xl mx-auto h-[calc(100dvh-140px)] md:h-[calc(100vh-120px)] flex flex-col md:flex-row bg-off-white rounded-[24px] md:rounded-[32px] shadow-[var(--shadow-soft)] border border-soft-stone overflow-hidden min-w-0"
    >
      {/* Left Sidebar - Removed Recent Chats since there's no backend for it, kept clear layout */}
      <div className="hidden md:flex w-72 flex-col border-r border-soft-stone bg-warm-ivory">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="text-purple-600">
              <Bot className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 leading-none">AI Assistant</h2>
              <p className="text-[11px] text-neutral-500 mt-1">Your Business Advisor</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 mt-4">
          <p className="text-sm text-neutral-600 leading-relaxed font-medium">
            Your intelligent shop assistant, securely plugged into your live database. Gain insights into revenue, track top-performing products, and discover your best customers instantly.
          </p>
        </div>

        <div className="px-6 mt-auto pb-6">
          <button 
            onClick={() => setMessages([])}
            className="w-full py-3 bg-off-white border border-soft-stone rounded-xl text-xs font-bold text-forest-green flex items-center justify-center gap-2 hover:bg-forest-green/5 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-off-white p-4 pb-0 min-h-0">
        <AIStatusNotice type="advisor" />

        {messages.length > 0 && (
          <div className="flex items-center justify-end px-6 py-3 border-b border-soft-stone/50 bg-off-white shrink-0">
            <button
              onClick={() => setMessages([])}
              className="text-xs font-semibold text-muted-red flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted-red/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear Chat
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 text-center relative overflow-y-auto min-h-0">
            <div className="w-20 h-20 md:w-24 md:h-24 mb-6 relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#f5f3ef]/50 rounded-full blur-xl"></div>
              <BotMessageSquare className="w-full h-full text-sage-green/40 absolute z-10 drop-shadow-md" strokeWidth={1} />
            </div>
            
            <h2 className="text-2xl font-bold text-neutral-900 mb-2 flex items-center justify-center gap-2">
              Namaste! <Bot className="w-7 h-7 text-sage-green" />
            </h2>
            <p className="text-sm text-neutral-500 mb-8">I&apos;m here to help you grow your business smarter.</p>
            
            <div className="w-full max-w-xl text-left">
              
              {/* Highlighted 'What I Can Do' Section */}
              <div className="mb-8 p-6 bg-gradient-to-br from-forest-green/10 to-emerald/5 border-2 border-forest-green/20 rounded-[20px] shadow-sm relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-forest-green/10 rounded-full blur-3xl"></div>
                <h3 className="text-sm font-extrabold text-forest-green mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-5 h-5" /> What I Can Do For You
                </h3>
                <ul className="text-[13px] md:text-sm text-neutral-700 leading-relaxed list-disc list-inside space-y-2 font-medium">
                  <li><span className="text-neutral-900 font-bold">Analyze live data:</span> Sales, bills, products, and customers.</li>
                  <li><span className="text-neutral-900 font-bold">Generate reports:</span> Daily summaries, monthly trends, and performance.</li>
                  <li><span className="text-neutral-900 font-bold">Multilingual support:</span> Converse smoothly in English, Hindi, or Bengali.</li>
                </ul>
                
                <div className="mt-5 pt-4 border-t border-forest-green/15 relative z-10">
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-muted-red" /> Limitations & Expectations
                  </h4>
                  <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                    Please do not expect me to execute administrative tasks. I cannot create or delete bills, alter your shop&apos;s database, or process payments. My purpose is strictly to provide analytical insights and answer questions based on your existing data.
                  </p>
                </div>
              </div>

              <p className="text-[13px] font-bold text-neutral-800 mb-3 px-1 uppercase tracking-wide">Try asking me</p>
              <div className="grid grid-cols-2 gap-3">
                {presetQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q.title)}
                    className="flex items-center gap-3 p-3.5 bg-off-white border border-soft-stone rounded-[16px] hover:border-sage-green hover:shadow-sm transition-all text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${q.bg} ${q.color}`}>
                      <q.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[13px] font-bold text-neutral-800 leading-tight">{q.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat History */
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'items-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="px-5 py-3 rounded-2xl rounded-tr-sm bg-sage-green/10 border border-sage-green/20 text-neutral-900 text-[14px]">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-forest-green flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-warm-ivory" />
                      </div>
                      <div className="px-5 py-3 rounded-2xl rounded-tl-sm bg-warm-ivory border border-soft-stone text-neutral-800 shadow-sm text-[14px] prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-100 prose-pre:text-neutral-800 prose-strong:text-neutral-900 prose-strong:font-semibold">
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-forest-green text-warm-ivory flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-warm-ivory border border-soft-stone text-neutral-500 flex gap-1 items-center shadow-sm">
                  <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 pb-28 md:pb-6 md:p-6 bg-off-white shrink-0 mt-auto">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center w-full"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your business..."
              className="w-full pl-6 pr-14 py-4 bg-warm-ivory border border-soft-stone rounded-2xl focus:outline-none focus:border-forest-green/30 focus:ring-4 focus:ring-forest-green/5 transition-all text-[14px]"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-3 p-2.5 bg-[#4c7c5b] text-white rounded-xl hover:bg-[#3d654a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </motion.div>
  );
}
