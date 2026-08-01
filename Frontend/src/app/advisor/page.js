'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/utils/animations';
import { 
  BotMessageSquare, Send, Bot, User, 
  FileText, TrendingUp, Users, AlertTriangle, Plus, Trash2
} from 'lucide-react';
import api from '@/services/api';

const presetQuestions = [
  { title: "Today's Summary", icon: FileText, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10" },
  { title: "Top Products", icon: TrendingUp, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-500/10" },
  { title: "Best Customers", icon: Users, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10" },
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
        content: err.response?.data?.message || 'Sorry, I encountered an error while processing your request.'
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
      className="max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col md:flex-row bg-off-white rounded-[24px] md:rounded-[32px] shadow-[var(--shadow-soft)] border border-soft-stone overflow-hidden min-w-0"
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
          <p className="text-sm text-neutral-500 leading-relaxed">
            I am connected directly to your shop&apos;s database. Ask me about your revenue, top customers, bestselling items, or get a daily summary.
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
      <div className="flex-1 flex flex-col relative bg-off-white">

        {messages.length > 0 && (
          <div className="flex items-center justify-end px-6 py-3 border-b border-soft-stone/50 bg-off-white">
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
            <div className="w-32 h-32 mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#f5f3ef]/50 rounded-full blur-xl"></div>
              <BotMessageSquare className="w-full h-full text-sage-green/40 absolute z-10 drop-shadow-md" strokeWidth={1} />
            </div>
            
            <h2 className="text-xl font-bold text-neutral-900 mb-2 flex items-center justify-center gap-2">
              Namaste! <Bot className="w-6 h-6 text-sage-green" />
            </h2>
            <p className="text-[13px] text-neutral-500 mb-10">I&apos;m here to help you grow your business smarter.</p>
            
            <div className="w-full max-w-lg text-left">
              <p className="text-[13px] font-bold text-neutral-800 mb-3 px-1">Try asking me</p>
              <div className="grid grid-cols-2 gap-3">
                {presetQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q.title)}
                    className="flex items-center gap-3 p-3 bg-off-white border border-soft-stone rounded-[14px] hover:border-sage-green hover:shadow-sm transition-all text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${q.bg} ${q.color}`}>
                      <q.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-neutral-800 leading-tight">{q.title}</span>
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
                      <div className="px-5 py-3 rounded-2xl rounded-tl-sm bg-warm-ivory border border-soft-stone text-neutral-800 shadow-sm text-[14px] prose prose-sm max-w-none">
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i} className="mb-1">{line}</p>
                        ))}
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
        <div className="p-6 bg-off-white">
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
