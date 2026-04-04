import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your **RentHub Assistant**. How can I help you discover premium listings today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Build conversation history as prompt
      let fullPrompt = `You are "RentHub AI", a premium marketplace assistant.
Platform: RentHub is a marketplace for buying, selling, and renting premium items (Real Estate, Vehicles, Luxury Watches, Electronics, Furniture, and more).
Personality: Professional, helpful, and concise. Use **bold** for key terms.
Goal: Help users find products, understand how renting/buying works, and navigate the platform.

`;
      messages.forEach(m => {
        fullPrompt += `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}\n`;
      });
      fullPrompt += `User: ${userMessage}\nAssistant:`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: fullPrompt,
      });

      const text = response.text;
      setMessages(prev => [...prev, { role: 'assistant', content: text || "I'm not sure about that. Try asking something else!" }]);
    } catch (err: any) {
      console.error('Chat Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  // Simple formatter for **bold** text
  const formatContent = (content: string) => {
    return content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: 30, right: 30,
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
          color: 'white', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', zIndex: 1000,
          boxShadow: '0 12px 30px rgba(0,0,0,0.3)', border: 'none',
        }}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: 110, right: 30,
              width: '90%', maxWidth: 400, height: 500,
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)', borderRadius: 28,
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden', zIndex: 999,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px 28px', background: '#1a1a1a',
              color: 'white', display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{
                width: 40, height: 40, background: 'rgba(255,255,255,0.1)',
                borderRadius: 12, display: 'flex', alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>RentHub Assistant</div>
                <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>AI Powered</div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              style={{
                flex: 1, overflowY: 'auto', padding: '24px',
                display: 'flex', flexDirection: 'column', gap: 16
              }}
              className="scrollbar-hide"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', gap: 12,
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: msg.role === 'user' ? '#1a1a1a' : '#f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {msg.role === 'user' ? <User size={16} color="#fff" /> : <Sparkles size={16} color="#1a1a1a" />}
                  </div>
                  <div style={{
                    padding: '12px 18px', borderRadius: 20,
                    maxWidth: '80%', fontSize: 14, lineHeight: 1.5,
                    backgroundColor: msg.role === 'user' ? '#1a1a1a' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                    boxShadow: msg.role === 'user' ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                    border: msg.role === 'user' ? 'none' : '1px solid #f0f0f0',
                    borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 20,
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 20,
                  }}>
                    {formatContent(msg.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, background: '#f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div style={{
                    padding: '12px 18px', background: '#fff', borderRadius: 20,
                    borderBottomLeftRadius: 4, border: '1px solid #f0f0f0',
                    fontSize: 14, color: '#666'
                  }}>
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSend}
              style={{
                padding: '20px 24px', background: '#fff',
                borderTop: '1px solid #f0f0f0', display: 'flex', gap: 12
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about listings, pricing..."
                style={{
                  flex: 1, padding: '14px 20px', borderRadius: 16,
                  background: '#f8f9fa', border: '1px solid #eee',
                  fontSize: 14, outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#1a1a1a')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#eee')}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: '#1a1a1a', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  opacity: input.trim() ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
              >
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </>
  );
}
