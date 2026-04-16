import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, User, Clock, ChevronRight, Inbox, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ChatWindow from './ChatWindow';

export default function ChatInbox({ variant = 'default' }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'window' for floating mode

  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;
  const chatUserId = isAdmin ? "admin" : user?._id;

  const isFloating = variant === 'floating';

  useEffect(() => {
    if (!chatUserId) return;
    
    fetch(`/api/chat/sessions/user/${chatUserId}`)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [chatUserId]);

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    if (isFloating) setView('window');
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[300px]">
      <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className={`flex h-full ${isFloating ? 'flex-col' : 'gap-8'}`}>
      {/* Session List */}
      <AnimatePresence mode="wait">
        {(!isFloating || view === 'list') && (
          <motion.div 
            key="list"
            initial={isFloating ? { opacity: 0, x: -20 } : { opacity: 1 }}
            animate={{ opacity: 1, x: 0 }}
            exit={isFloating ? { opacity: 0, x: -20 } : {}}
            className={`${isFloating ? 'w-full' : 'w-full md:w-80'} flex flex-col gap-6 overflow-hidden h-full`}
          >
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
              {sessions.map((session) => {
                const isActive = selectedSession?._id === session._id;
                return (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSessionSelect(session)}
                    className={`
                      p-5 rounded-[2rem] cursor-pointer transition-all border group
                      ${isActive && !isFloating 
                        ? 'bg-black text-white border-black shadow-xl' 
                        : 'bg-white border-brand-primary/5 hover:border-brand-accent/30'}
                    `}
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-all
                        ${isActive && !isFloating ? 'bg-white/10 border-white/10' : 'bg-brand-muted border-brand-primary/5'}
                      `}>
                        <User className={`w-5 h-5 ${isActive && !isFloating ? 'text-white' : 'text-brand-primary/40'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm italic truncate tracking-tight">Conversation</h4>
                        <div className={`flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-[0.1em] ${isActive && !isFloating ? 'text-white/40' : 'text-brand-primary/30'}`}>
                          {new Date(session.lastMessageAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {session.lastMessage && (
                      <p className={`text-[11px] line-clamp-1 font-medium ${isActive && !isFloating ? 'text-white/60' : 'text-brand-primary/40'}`}>
                        {session.lastMessage}
                      </p>
                    )}
                  </motion.div>
                );
              })}

              {sessions.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-8 bg-white/50 rounded-[2.5rem] border border-dashed border-brand-primary/10">
                  <Inbox className="w-12 h-12 mb-4 text-brand-primary/20" />
                  <h3 className="text-lg font-display font-bold italic mb-1">No chats.</h3>
                  <p className="text-xs">Messages appear here.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Active Conversation */}
        {(!isFloating || view === 'window') && (
          <motion.div 
            key="window"
            initial={isFloating ? { opacity: 0, x: 20 } : { opacity: 1 }}
            animate={{ opacity: 1, x: 0 }}
            exit={isFloating ? { opacity: 0, x: 20 } : {}}
            className="flex-1 overflow-hidden h-full flex flex-col"
          >
            {isFloating && (
              <button 
                onClick={() => setView('list')}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-primary/40 hover:text-black mb-4 transition-colors p-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back to List
              </button>
            )}
            
            <AnimatePresence mode="wait">
              {selectedSession ? (
                <motion.div
                  key={selectedSession._id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="h-full"
                >
                  <ChatWindow 
                    sessionId={selectedSession._id} 
                    participantId={selectedSession.participants.find(p => p !== chatUserId)}
                    listingInfo={selectedSession.listingId}
                  />
                </motion.div>
              ) : !isFloating && (
                <div className="h-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[3.5rem] border border-dashed border-brand-primary/10 opacity-40">
                  <MessageSquare className="w-20 h-20 mb-6 text-brand-primary/20" />
                  <h3 className="text-2xl font-display font-bold italic">Select a conversation.</h3>
                  <p className="text-sm font-medium mt-2">Pick a chat from the left to start messaging.</p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
