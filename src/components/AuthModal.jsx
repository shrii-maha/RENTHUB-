import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SignIn, SignUp } from '@clerk/clerk-react';

const CLERK_APPEARANCE = {
  elements: {
    rootBox: 'w-full',
    card: 'shadow-none border-none bg-transparent p-0 w-full',
    headerTitle: 'text-xl font-display font-bold tracking-tighter',
    headerSubtitle: 'text-xs text-gray-400',
    socialButtonsBlockButton: 'border border-gray-100 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-xs',
    formButtonPrimary: 'bg-black hover:bg-gray-900 text-white rounded-xl font-bold py-3 shadow-xl shadow-black/20',
    formFieldInput: 'border border-gray-100 bg-gray-50/50 rounded-xl text-sm font-bold',
    footerActionLink: 'text-black font-bold hover:underline',
    formFieldLabel: 'text-xs font-bold text-gray-500',
    dividerRow: 'hidden',
    formHeader: 'hidden',
  }
};

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('signin');
  const { isSignedIn } = useAuth();

  // Auto-close modal when user signs in
  useEffect(() => {
    if (isSignedIn && isOpen) {
      onClose();
    }
  }, [isSignedIn, isOpen, onClose]);

  const switchMode = (m) => {
    setMode(m);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 32 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20"
          >
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-accent via-yellow-400 to-brand-accent animate-gradient-x" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-black/5 text-black/20 hover:text-black transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pt-10">
              {/* ─── SIGN UP ─── */}
              {mode === 'signup' && (
                <div>
                  <button
                    onClick={() => switchMode('signin')}
                    className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors mb-4"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back to Sign In
                  </button>

                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-black/20">R</div>
                    <span className="text-2xl font-display font-bold tracking-tighter">RentHub</span>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-2xl font-display font-bold tracking-tighter leading-tight mb-1.5">Join the Hub.</h2>
                    <p className="text-gray-400 text-xs font-medium">Create an account to start buying and selling.</p>
                  </div>

                  <SignUp
                    appearance={CLERK_APPEARANCE}
                    routing="virtual"
                  />

                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400 font-medium">
                      Already have an account?{' '}
                      <button onClick={() => switchMode('signin')} className="text-black font-bold hover:underline">Sign in</button>
                    </p>
                  </div>
                  <SecurityBadge />
                </div>
              )}

              {/* ─── SIGN IN ─── */}
              {mode === 'signin' && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-black/20">R</div>
                    <span className="text-2xl font-display font-bold tracking-tighter">RentHub</span>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-2xl font-display font-bold tracking-tighter leading-tight mb-1.5">Welcome Back.</h2>
                    <p className="text-gray-400 text-xs font-medium">Enter your credentials to access your account.</p>
                  </div>

                  <SignIn
                    appearance={CLERK_APPEARANCE}
                    routing="virtual"
                  />

                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400 font-medium">
                      Don&apos;t have an account?{' '}
                      <button onClick={() => switchMode('signup')} className="text-black font-bold hover:underline">
                        Sign up for free
                      </button>
                    </p>
                  </div>
                  <SecurityBadge />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SecurityBadge() {
  return (
    <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span>Secured by Clerk</span>
    </div>
  );
}
