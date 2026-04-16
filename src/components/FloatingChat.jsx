import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ChatInbox from './ChatInbox';

export default function FloatingChat({ isOpen: externalOpen, onOpenToggle }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, loading } = useAuth();

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = onOpenToggle || setInternalOpen;

  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;
  const chatUserId = isAdmin ? "admin" : user?._id;

  // Fetch unread count periodically
  useEffect(() => {
    if (loading || !chatUserId) return;

    const fetchUnread = () => {
      fetch(`/api/chat/sessions/user/${chatUserId}`)
        .then(res => res.json())
        .then(data => {
            const count = data.reduce((acc, session) => {
                // Determine if there are unread messages for the current user
                // This logic depends on the session structure. 
                // For now, let's assume if last message isn't from us and session has unread flag.
                return acc + (session.unreadCount || 0);
            }, 0);
            setUnreadCount(count);
        })
        .catch(console.error);
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [isLoaded, chatUserId]);

  if (loading || !user) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[400px] h-[600px] bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white/50 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-2 flex items-center justify-between border-b border-brand-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest italic text-black">Messages</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-xl transition-colors"
                >
                  <Minus className="w-4 h-4 text-black/40" />
                </button>
              </div>
            </div>

            {/* Inbox Content */}
            <div className="flex-1 p-6 overflow-hidden">
              <ChatInbox variant="floating" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center w-16 h-16 rounded-[2rem] shadow-2xl transition-all duration-500
          ${isOpen ? 'bg-black rotate-90' : 'bg-brand-accent'}
        `}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-7 h-7 text-brand-primary" strokeWidth={2.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce border-2 border-white">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </motion.button>
    </div>
  );
}
