import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, User, Clock, ChevronRight, Inbox } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import ChatWindow from './ChatWindow';

export default function ChatInbox() {
  const { user } = useUser();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetch(`/api/chat/sessions/user/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [user?.id]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex h-full gap-8">
      {/* Session List */}
      <div className="w-full md:w-80 flex flex-col gap-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 pr-4 scrollbar-hide">
          {sessions.map((session) => {
            const isActive = selectedSession?._id === session._id;
            return (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedSession(session)}
                className={`
                  p-6 rounded-[2.2rem] cursor-pointer transition-all border group
                  ${isActive 
                    ? 'bg-black text-white border-black shadow-xl' 
                    : 'bg-white border-brand-primary/5 hover:border-brand-accent/30'}
                `}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-all
                    ${isActive ? 'bg-white/10 border-white/10 group-hover:rotate-6' : 'bg-brand-muted border-brand-primary/5'}
                  `}>
                    <User className={`w-6 h-6 ${isActive ? 'text-white' : 'text-brand-primary/40'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[15px] italic truncate tracking-tight">Conversation</h4>
                    <div className={`flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.1em] ${isActive ? 'text-white/40' : 'text-brand-primary/30'}`}>
                      <Clock className="w-3 h-3" />
                      {new Date(session.lastMessageAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {session.lastMessage && (
                  <p className={`text-xs line-clamp-1 font-medium ${isActive ? 'text-white/60' : 'text-brand-primary/40'}`}>
                    {session.lastMessage}
                  </p>
                )}
                {session.listingId && (
                  <div className={`mt-3 pt-3 border-t text-[9px] font-bold uppercase tracking-widest ${isActive ? 'border-white/10 text-brand-accent' : 'border-brand-primary/5 text-gray-400'}`}>
                    Ref: {session.listingId.title}
                  </div>
                )}
              </motion.div>
            );
          })}

          {sessions.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-8 bg-white/50 rounded-[3rem] border border-dashed border-brand-primary/10">
              <Inbox className="w-16 h-16 mb-4 text-brand-primary/20" />
              <h3 className="text-xl font-display font-bold italic mb-2">No conversations.</h3>
              <p className="text-sm">When you chat with sellers, your messages will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Conversation */}
      <div className="flex-1 overflow-hidden">
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
                participantId={selectedSession.participants.find(p => p !== user.id)}
                listingInfo={selectedSession.listingId}
              />
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[3.5rem] border border-dashed border-brand-primary/10 opacity-40">
              <MessageSquare className="w-20 h-20 mb-6 text-brand-primary/20" />
              <h3 className="text-2xl font-display font-bold italic">Select a conversation.</h3>
              <p className="text-sm font-medium mt-2">Pick a chat from the left to start messaging.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
