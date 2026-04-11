import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Clock, Check, CheckCheck } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useUser } from '@clerk/clerk-react';

export default function ChatWindow({ sessionId, participantId, listingInfo }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const isAdmin = user?.primaryEmailAddress?.emailAddress === import.meta.env.VITE_ADMIN_EMAIL;
  const chatUserId = isAdmin ? "admin" : user?.id;

  useEffect(() => {
    if (!sessionId) return;

    // Join the session room
    if (socket) {
      socket.emit('join_session', sessionId);
    }

    // Fetch message history
    fetch(`/api/chat/messages/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
        // Mark as read
        fetch(`/api/chat/messages/${sessionId}/read`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: chatUserId })
        });
      })
      .catch(console.error);

    // Listen for new messages
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    if (socket) {
      socket.on('new_message', handleNewMessage);
    }

    return () => {
      if (socket) {
        socket.off('new_message', handleNewMessage);
      }
    };
  }, [sessionId, socket, chatUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', {
      sessionId,
      senderId: chatUserId,
      text: newMessage
    });

    setNewMessage('');
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand-primary/40 text-xs font-mono uppercase tracking-[0.2em]">Syncing Messages...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-white/50 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-brand-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-muted rounded-2xl flex items-center justify-center border border-brand-primary/5">
            <User className="w-6 h-6 text-brand-primary/40" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black leading-tight italic">Conversation</h3>
            {listingInfo && (
              <p className="text-[10px] text-brand-primary/40 font-mono uppercase tracking-widest mt-1">
                Ref: {listingInfo.title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === chatUserId;
          return (
            <motion.div
              key={msg._id || idx}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] group`}>
                <div className={`
                  px-6 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm
                  ${isMe 
                    ? 'bg-black text-white rounded-tr-none' 
                    : 'bg-white border border-brand-primary/5 text-black rounded-tl-none'}
                `}>
                  {msg.text}
                </div>
                <div className={`flex items-center gap-2 mt-2 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[9px] font-mono text-brand-primary/30 uppercase tracking-widest">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    msg.isRead ? <CheckCheck className="w-3 h-3 text-brand-accent" /> : <Check className="w-3 h-3 text-brand-primary/20" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
            <div className="w-20 h-20 bg-brand-muted rounded-full flex items-center justify-center">
              <Send className="w-10 h-10" />
            </div>
            <p className="text-sm font-medium">No messages yet.<br/>Start the conversation below.</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-6 border-t border-brand-primary/5 bg-white/30">
        <div className="relative">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full bg-white border border-brand-primary/5 rounded-[1.8rem] py-4 pl-6 pr-16 text-sm focus:ring-2 focus:ring-brand-accent outline-none transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 top-2 w-11 h-11 bg-black text-white rounded-full flex items-center justify-center hover:scale-105 transition-all disabled:opacity-20 shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
