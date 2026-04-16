import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, User as UserIcon, Loader2 as LoaderIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error('API key not configured. Add VITE_GROQ_API_KEY to Vercel environment variables.');

      const systemContext = `You are "RentHub AI", the official smart assistant for RentHub Marketplace.

## About RentHub
RentHub is a modern, premium marketplace platform designed to make renting, buying, and selling items easy, secure, and accessible for everyone.
It bridges the gap between people who own items they rarely use and those who need temporary access to those same things.

## What We Offer
- **Real Estate**: Villas, apartments, office spaces for rent or sale
- **Vehicles**: Cars, bikes, and other vehicles
- **Luxury Items**: Watches, jewellery, premium accessories
- **Electronics**: Cameras, gadgets, tech equipment
- **Furniture**: Home and office furniture
- **General Items**: Tools, sports equipment, and everyday essentials
Users can **List items for Sale or Rental**, browse the **Marketplace**, make secure payments via **Stripe**, and track orders through **My Hub**.

## Founder
RentHub was founded by **Srimanta Maharana**, a BSc IT student (graduating 2026) with a passion for technology and building platforms that create real-world value.
- GitHub: https://github.com/shrii-maha
- LinkedIn: https://www.linkedin.com/in/srimanta-maharana-853aa62a4/
- Instagram: https://www.instagram.com/srimantmaharana
- Contact: 8097831527

## Our Values
- **Simplicity**: Clean, easy-to-use platform
- **Trust**: Verified users and transparent system
- **Accessibility**: Rent anything, anytime, anywhere
- **Innovation**: Continuously improving with modern tech (MERN Stack, AI, Stripe payments, cloud storage)

## How It Works & Delivery Process
1. Sign up / Log in using your Google or Email account (via Clerk)
2. Browse items in the Marketplace or use Search filters
3. Click on an item to view details and Rent/Buy
4. **Payment & Escrow**: Pay securely via Stripe. Funds are held in Escrow until you receive the item.
5. **Delivery Options**: We support Direct Shipping, In-person Pickup, and RentHub Partner Delivery.
6. **Confirmation**: Once you receive the product, confirm delivery on the RentHub platform.
7. **Escrow Release**: Only after your confirmation, the funds are released to the seller.

## Your Role
Be helpful, warm, and concise. Answer questions about listings, how to sell/rent, platform features, pricing, and the founder.
If someone asks about the owner or founder, tell them about Srimanta Maharana.
If you don't know a specific listing detail, encourage the user to browse the Marketplace section on the site.`;

      const chatHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemContext },
            ...chatHistory,
            { role: 'user', content: userMessage }
          ],
          max_tokens: 400,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "I'm not sure. Please try asking again.";
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (err: any) {
      console.error('Chat Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
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
                    {msg.role === 'user' ? <UserIcon size={16} color="#fff" /> : <Sparkles size={16} color="#1a1a1a" />}
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
                    <LoaderIcon size={16} className="animate-spin" />
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
