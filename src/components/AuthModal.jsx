import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, Github, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot' | 'reset'
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '', resetToken: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, register } = useAuth();

  // Auto-detect reset token in URL and open reset mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setForm(prev => ({ ...prev, resetToken: token }));
      setMode('reset');
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'forgot') {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send email.');
        setSuccess('Check your inbox! A reset link has been sent to your email.');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (form.password !== form.confirm) return setError('Passwords do not match.');
      if (form.password.length < 6) return setError('Password must be at least 6 characters.');
      setLoading(true);
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: form.resetToken, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Reset failed.');
        setSuccess('Password updated! You can now sign in.');
        setTimeout(() => switchMode('signin'), 2000);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (!form.fullName.trim()) return setError('Full name is required.');
      if (form.password !== form.confirm) return setError('Passwords do not match.');
      if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await login(form.email, form.password);
      } else {
        await register(form.fullName, form.email, form.password);
      }
      setForm({ fullName: '', email: '', password: '', confirm: '', resetToken: '' });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setSuccess('');
    setForm({ fullName: '', email: '', password: '', confirm: '' });
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
              {(mode === 'forgot' || mode === 'reset') ? (
                <button 
                  onClick={() => switchMode('signin')}
                  className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors mb-8"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </button>
              ) : (
                <div className="flex items-center gap-2 mb-6">
                   <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-black/20">R</div>
                   <span className="text-2xl font-display font-bold tracking-tighter">RentHub</span>
                </div>
              )}

              {/* Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold tracking-tighter leading-tight mb-1.5">
                  {mode === 'signin' ? 'Welcome Back.' : mode === 'signup' ? 'Join the Hub.' : mode === 'reset' ? 'Set New Password.' : 'Reset Password.'}
                </h2>
                <p className="text-gray-400 text-xs font-medium">
                  {mode === 'signin' ? 'Enter your credentials to access your account.' : 
                   mode === 'signup' ? 'Create an account to start buying and selling.' :
                   mode === 'reset' ? 'Choose a new secure password for your account.' :
                   'Enter your email to receive a recovery link.'}
                </p>
              </div>

              {/* Social Logins - only for signin/signup */}
              {(mode === 'signin' || mode === 'signup') && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button 
                    onClick={() => window.location.href = '/api/auth/google'}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-all group"
                  >
                    <Chrome className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Google</span>
                  </button>
                  <button 
                    onClick={() => window.location.href = '/api/auth/github'}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-all group"
                  >
                    <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">GitHub</span>
                  </button>
                </div>
              )}

              {(mode === 'signin' || mode === 'signup') && (
                <div className="relative flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[9px] uppercase font-bold tracking-widest text-gray-300">or use email</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {mode === 'signup' && (
                    <motion.div
                      key="signup-field"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <InputField
                        icon={<User className="w-4 h-4" />}
                        name="fullName"
                        type="text"
                        placeholder="Full Name"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                      />
                    </motion.div>
                  )}

                  {/* Email field — hidden for reset mode */}
                  {mode !== 'reset' && (
                  <InputField
                    key="email-field"
                    icon={<Mail className="w-4 h-4" />}
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  )}

                  {mode !== 'forgot' && (
                    <motion.div key="password-container" className="relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <InputField
                        icon={<Lock className="w-4 h-4" />}
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </motion.div>
                  )}

                  {(mode === 'signup' || mode === 'reset') && (
                    <motion.div
                      key="confirm-field"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <InputField
                        icon={<Lock className="w-4 h-4" />}
                        name="confirm"
                        type="password"
                        placeholder="Confirm Password"
                        value={form.confirm}
                        onChange={handleChange}
                        required
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode === 'signin' && (
                  <div className="flex justify-end">
                    <button 
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs font-bold text-gray-400 hover:text-brand-accent transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Error / Success Feedback */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-500 text-xs font-bold bg-red-50 px-5 py-4 rounded-2xl border border-red-100 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-emerald-600 text-xs font-bold bg-emerald-50 px-5 py-4 rounded-2xl border border-emerald-100 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm tracking-wide hover:bg-gray-900 transition-all shadow-xl shadow-black/20 disabled:opacity-60 flex items-center justify-center gap-3 mt-1"
                >
                   {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing Request...</>
                    : mode === 'signin' ? 'Sign In' 
                    : mode === 'signup' ? 'Create Account' 
                    : mode === 'reset' ? 'Set New Password'
                    : 'Send Reset Link'
                  }
                </motion.button>
              </form>

              {/* Footer Toggle */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 font-medium">
                  {mode === 'signin' ? "Don't have an account?" : mode === 'signup' ? "Already have an account?" : "Remember your password?"}
                  {' '}
                  <button 
                    onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="text-black font-bold hover:underline"
                  >
                    {mode === 'signin' ? 'Sign up for free' : 'Sign in'}
                  </button>
                </p>
              </div>

              {/* Security Badge */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>End-to-End Encrypted Authentication</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function InputField({ icon, name, type, placeholder, value, onChange, required }) {
  return (
    <div className="group relative flex items-center gap-3 bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus-within:border-black/20 focus-within:bg-white focus-within:shadow-md focus-within:shadow-black/5 transition-all">
      <span className="text-gray-300 group-focus-within:text-black transition-colors">{icon}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="flex-1 bg-transparent text-[15px] font-bold text-black placeholder-gray-300 outline-none"
      />
    </div>
  );
}
