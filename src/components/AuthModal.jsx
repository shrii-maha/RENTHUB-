import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { login, register, isSignedIn } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Auto-close modal when user signs in
  useEffect(() => {
    if (isSignedIn && isOpen) {
      onClose();
    }
  }, [isSignedIn, isOpen, onClose]);

  const resetState = () => {
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setFullName('');
  };

  const switchMode = (m) => {
    setMode(m);
    resetState();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await login(email, password);
      } else if (mode === 'signup') {
        await register(fullName, email, password);
      } else if (mode === 'forgot-password') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
          setSuccess('Reset link sent! Please check your email.');
        } else {
          const text = await res.text();
          if (!res.ok) throw new Error(`Server error (${res.status}). Your backend might be down or unreachable.`);
          throw new Error('Unexpected response from server.');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider) => {
    window.location.href = `/api/auth/${provider}`;
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
              {/* Header */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-black/20">R</div>
                <span className="text-2xl font-display font-bold tracking-tighter">RentHub</span>
              </div>

              {/* Dynamic Header Text */}
              <div className="mb-6">
                {mode === 'signin' && (
                  <>
                    <h2 className="text-2xl font-display font-bold tracking-tighter leading-tight mb-1.5">Welcome Back.</h2>
                    <p className="text-gray-400 text-xs font-medium">Enter your credentials to access your account.</p>
                  </>
                )}
                {mode === 'signup' && (
                  <>
                    <button
                      onClick={() => switchMode('signin')}
                      className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors mb-4"
                    >
                      <ArrowLeft className="w-3 h-3" /> Back to Sign In
                    </button>
                    <h2 className="text-2xl font-display font-bold tracking-tighter leading-tight mb-1.5">Join the Hub.</h2>
                    <p className="text-gray-400 text-xs font-medium">Create an account to start buying and selling.</p>
                  </>
                )}
                {mode === 'forgot-password' && (
                  <>
                    <button
                      onClick={() => switchMode('signin')}
                      className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors mb-4"
                    >
                      <ArrowLeft className="w-3 h-3" /> Back to Sign In
                    </button>
                    <h2 className="text-2xl font-display font-bold tracking-tighter leading-tight mb-1.5">Reset Password.</h2>
                    <p className="text-gray-400 text-xs font-medium">Enter your email and we'll send you a link to reset your password.</p>
                  </>
                )}
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-bold">
                  {success}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border border-gray-200 bg-gray-50/50 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
                      placeholder="John Doe"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50/50 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="you@example.com"
                  />
                </div>

                {mode !== 'forgot-password' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-500">Password</label>
                      {mode === 'signin' && (
                        <button 
                          type="button" 
                          onClick={() => switchMode('forgot-password')}
                          className="text-[10px] font-bold text-gray-400 hover:text-black"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-gray-200 bg-gray-50/50 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black hover:bg-gray-900 text-white rounded-xl font-bold py-3.5 shadow-xl shadow-black/20 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot-password' && 'Send Reset Link'}
                </button>
              </form>

              {/* Social Login (Only on Sign In / Sign Up) */}
              {mode !== 'forgot-password' && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-gray-400 font-bold">Or continue with</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleOAuth('google')}
                      className="flex items-center justify-center gap-2 border border-gray-100 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-xs py-3 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </button>
                    <button
                      onClick={() => handleOAuth('github')}
                      className="flex items-center justify-center gap-2 border border-gray-100 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-xs py-3 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      GitHub
                    </button>
                  </div>
                </div>
              )}

              {/* Footer Switcher */}
              <div className="mt-6 text-center">
                {mode === 'signin' && (
                  <p className="text-xs text-gray-400 font-medium">
                    Don&apos;t have an account?{' '}
                    <button onClick={() => switchMode('signup')} className="text-black font-bold hover:underline">
                      Sign up for free
                    </button>
                  </p>
                )}
                {mode === 'signup' && (
                  <p className="text-xs text-gray-400 font-medium">
                    Already have an account?{' '}
                    <button onClick={() => switchMode('signin')} className="text-black font-bold hover:underline">
                      Sign in
                    </button>
                  </p>
                )}
              </div>
              
              {/* Security Badge */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secured by MERN Auth</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
