'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, listItemVariants } from '@/utils/animations';
import { BotMessageSquare, Send, Sparkles, User, RefreshCcw } from 'lucide-react';

const presetQuestions = [
  "What is my top-selling product this week?",
  "How much revenue did I make today?",
  "Which customers haven't visited in a month?",
  "What items are running low on stock?"
];

export default function AIAdvisor() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I am your Dukaan Saathi AI Advisor. I can analyze your sales, track inventory, or give business growth tips. What would you like to know today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (text) => {
    if (!text.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: `Based on your recent data regarding "${text}", your revenue is up 15% this week. I recommend restocking Aashirvaad Atta as you only have 45 units left, which usually sell out by the weekend.`
      }]);
    }, 1500);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col"
    >
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-3">
            <BotMessageSquare className="w-8 h-8 text-forest-green" />
            AI Business Advisor
          </h1>
          <p className="text-neutral-500 mt-1">Chat with your store's intelligent assistant.</p>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-soft-stone/50"
          title="Reset Chat"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </header>

      {/* Chat Area */}
      <div className="flex-1 bg-off-white rounded-[24px] shadow-[var(--shadow-soft)] border border-soft-stone/50 overflow-hidden flex flex-col relative">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-sage-green/20 text-forest-green' : 'bg-forest-green text-warm-ivory'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-base leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-sage-green/10 text-neutral-900 rounded-tr-sm' 
                    : 'bg-warm-ivory border border-soft-stone text-neutral-800 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-forest-green text-warm-ivory flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-warm-ivory border border-soft-stone text-neutral-500 rounded-tl-sm flex gap-1 items-center">
                <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Preset Questions */}
        {messages.length === 1 && (
          <motion.div variants={listItemVariants} initial="hidden" animate="show" className="px-6 pb-4">
            <p className="text-sm text-neutral-500 mb-3 font-medium">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {presetQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-4 py-2 bg-warm-ivory border border-soft-stone hover:border-sage-green rounded-xl text-sm text-neutral-700 hover:text-forest-green transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-warm-ivory border-t border-soft-stone/50">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your business..."
              className="w-full pl-6 pr-14 py-4 bg-off-white border border-soft-stone rounded-2xl focus:outline-none focus:border-sage-green focus:ring-1 focus:ring-sage-green transition-all shadow-[var(--shadow-soft)]"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-3 p-2.5 bg-forest-green text-warm-ivory rounded-xl hover:bg-forest-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </motion.div>
  );
}
