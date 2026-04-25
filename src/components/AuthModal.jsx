import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable input field
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, required = true, minLength, rightSlot }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
        {rightSlot}
      </div>
      <div className="relative">
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-transparent transition-all pr-10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Google SVG icon
// ─────────────────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// GitHub SVG icon
// ─────────────────────────────────────────────────────────────────────────────
const GitHubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main AuthModal component
// ─────────────────────────────────────────────────────────────────────────────
export default function AuthModal({ isOpen, onClose }) {
  // 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState('signin');

  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, isSignedIn } = useAuth();

  // Auto-close when the user becomes signed-in
  useEffect(() => {
    if (isSignedIn && isOpen) onClose();
  }, [isSignedIn, isOpen, onClose]);

  // Reset form state whenever we switch tabs or the modal opens/closes
  useEffect(() => {
    setFullName('');
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
    setLoading(false);
  }, [mode, isOpen]);

  // ── Form submission ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await login(email, password);
        // onClose() will fire via the useEffect above

      } else if (mode === 'signup') {
        await register(fullName, email, password);
        // onClose() will fire via the useEffect above

      } else if (mode === 'forgot') {
        const res  = await fetch('/api/auth/forgot-password', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email })
        });

        let data = {};
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) data = await res.json();
        if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);

        setSuccess('✅ Password reset link sent! Please check your email inbox.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OAuth redirect ────────────────────────────────────────────────────────
  // Points to the Vercel proxy (/api/auth/google → Render backend)
  const handleOAuth = (provider) => {
    window.location.href = `/api/auth/${provider}`;
  };

  // ── Helper to render the correct heading ──────────────────────────────────
  const heading = { signin: 'Welcome Back', signup: 'Create Account', forgot: 'Reset Password' }[mode];
  const sub = {
    signin: 'Sign in to access your RentHub account.',
    signup: 'Join thousands of renters and listers.',
    forgot: "We'll email you a secure link to reset your password.",
  }[mode];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* ── Backdrop ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* ── Modal card ── */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.92, y: 24  }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.35)] overflow-hidden"
          >
            {/* Top colour bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-8 pt-9 pb-8">
              {/* Logo */}
              <div className="flex items-center gap-2 mb-7">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-base shadow">R</div>
                <span className="text-xl font-black tracking-tight">RentHub</span>
              </div>

              {/* Back arrow for non-main screens */}
              {(mode === 'signup' || mode === 'forgot') && (
                <button
                  onClick={() => setMode('signin')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-black transition-colors mb-5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              )}

              {/* Heading */}
              <div className="mb-7">
                <h2 className="text-2xl font-black tracking-tight text-gray-900 mb-1">{heading}</h2>
                <p className="text-xs text-gray-400 font-medium">{sub}</p>
              </div>

              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold"
                >
                  <span className="mt-0.5 shrink-0">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Success banner */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold"
                >
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                  <span>{success}</span>
                </motion.div>
              )}

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {mode === 'signup' && (
                  <Field
                    label="Full Name"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                )}

                <Field
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />

                {mode !== 'forgot' && (
                  <Field
                    label="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    rightSlot={
                      mode === 'signin' ? (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors"
                        >
                          Forgot password?
                        </button>
                      ) : null
                    }
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-xl py-3.5 shadow-lg shadow-black/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === 'signin'  && (loading ? 'Signing In…'   : 'Sign In')}
                  {mode === 'signup'  && (loading ? 'Creating…'     : 'Create Account')}
                  {mode === 'forgot'  && (loading ? 'Sending…'      : 'Send Reset Link')}
                </button>
              </form>

              {/* ── Social Login ── */}
              {mode !== 'forgot' && (
                <div className="mt-6">
                  <div className="relative flex items-center mb-5">
                    <div className="flex-grow border-t border-gray-100" />
                    <span className="flex-shrink mx-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                      or continue with
                    </span>
                    <div className="flex-grow border-t border-gray-100" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Google */}
                    <button
                      type="button"
                      id="btn-oauth-google"
                      onClick={() => handleOAuth('google')}
                      className="flex items-center justify-center gap-2.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl py-3 text-sm font-semibold text-gray-700 transition-all hover:shadow-md"
                    >
                      <GoogleIcon />
                      Google
                    </button>

                    {/* GitHub */}
                    <button
                      type="button"
                      id="btn-oauth-github"
                      onClick={() => handleOAuth('github')}
                      className="flex items-center justify-center gap-2.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl py-3 text-sm font-semibold text-gray-700 transition-all hover:shadow-md"
                    >
                      <GitHubIcon />
                      GitHub
                    </button>
                  </div>
                </div>
              )}

              {/* ── Mode switcher ── */}
              <p className="mt-6 text-center text-xs text-gray-400 font-medium">
                {mode === 'signin' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button onClick={() => setMode('signup')} className="font-bold text-black hover:underline">
                      Sign up free
                    </button>
                  </>
                ) : mode === 'signup' ? (
                  <>
                    Already have an account?{' '}
                    <button onClick={() => setMode('signin')} className="font-bold text-black hover:underline">
                      Sign in
                    </button>
                  </>
                ) : null}
              </p>

              {/* ── Security badge ── */}
              <div className="mt-7 pt-5 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                JWT Secured · bcrypt Encrypted · OAuth 2.0
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
