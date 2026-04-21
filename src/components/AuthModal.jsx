import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';

// Clerk appearance — matches RentHub brand
const CLERK_APPEARANCE = {
  layout: {
    socialButtonsPlacement: 'top',
    showOptionalFields: false,
  },
  elements: {
    rootBox: 'w-full',
    card: 'shadow-none border-none bg-transparent p-0 w-full',
    headerTitle: 'text-xl font-bold tracking-tighter text-black',
    headerSubtitle: 'text-xs text-gray-400',
    socialButtonsBlockButton:
      'border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-xs transition-all',
    socialButtonsBlockButtonText: 'text-xs font-bold text-gray-700',
    dividerRow: 'my-4',
    dividerText: 'text-[10px] uppercase tracking-widest text-gray-300 font-bold',
    formButtonPrimary:
      'bg-black hover:bg-gray-900 text-white rounded-xl font-bold py-3 text-sm shadow-xl shadow-black/20 transition-all',
    formFieldInput:
      'border border-gray-200 bg-gray-50/60 rounded-xl text-sm font-semibold focus:border-black focus:ring-0 transition-all',
    formFieldLabel: 'text-xs font-bold text-gray-500 mb-1',
    formFieldInputShowPasswordButton: 'text-gray-400 hover:text-black',
    footerActionLink: 'text-black font-bold hover:underline text-xs',
    footerActionText: 'text-xs text-gray-400',
    identityPreviewText: 'text-xs font-bold',
    identityPreviewEditButton: 'text-xs font-bold text-black hover:underline',
    formResendCodeLink: 'text-xs font-bold text-black hover:underline',
    otpCodeFieldInput: 'border border-gray-200 rounded-xl text-center font-bold text-lg',
    alertText: 'text-xs font-bold',
    formFieldErrorText: 'text-xs font-bold text-red-500',
    navbar: 'hidden',
    pageScrollBox: 'p-0',
  },
  variables: {
    colorPrimary: '#000000',
    colorText: '#000000',
    colorBackground: 'transparent',
    colorInputBackground: 'transparent',
    borderRadius: '0.75rem',
    fontFamily: 'inherit',
  },
};

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const { isSignedIn } = useAuth();

  // Auto-close when Clerk signs in
  useEffect(() => {
    if (isSignedIn && isOpen) {
      onClose();
    }
  }, [isSignedIn, isOpen, onClose]);

  // Reset to sign-in when modal reopens
  useEffect(() => {
    if (isOpen) setMode('signin');
  }, [isOpen]);

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

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.35)] overflow-hidden border border-white/20"
          >
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-brand-accent to-yellow-400" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-black/20 hover:text-black/60 transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* RentHub Brand Header */}
            <div className="px-8 pt-8 pb-2 flex items-center gap-2.5">
              <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                R
              </div>
              <span className="text-2xl font-display font-bold tracking-tighter">RentHub</span>
            </div>

            {/* Tab switcher */}
            <div className="px-8 pt-3 pb-4 flex gap-1 bg-white/50">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'signin'
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'signup'
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Clerk Components */}
            <div className="px-6 pb-8">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                  </div>
                }
              >
                <AnimatePresence mode="wait">
                  {mode === 'signin' ? (
                    <motion.div
                      key="signin"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.18 }}
                    >
                      <SignIn
                        appearance={CLERK_APPEARANCE}
                        routing="virtual"
                        signUpUrl="modal"
                        fallbackRedirectUrl="/"
                        signInForceRedirectUrl="/"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.18 }}
                    >
                      <SignUp
                        appearance={CLERK_APPEARANCE}
                        routing="virtual"
                        signInUrl="modal"
                        fallbackRedirectUrl="/"
                        signUpForceRedirectUrl="/"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Suspense>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
