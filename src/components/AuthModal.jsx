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
  const { login, register, isSignedIn } = useAuth();

  // Auto-close modal when user signs in
  useEffect(() => {
    if (isSignedIn && isOpen) {
      onClose();
    }
  }, [isSignedIn, isOpen, onClose]);

  // Auto-detect reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setForm(prev => ({ ...prev, resetToken: token }));
      setMode('reset');
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

              {/* ─── SIGN UP ─── Always custom form */}
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
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <button onClick={() => window.location.href = '/api/auth/google'}
                      className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-all group">
                      <Chrome className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">Google</span>
                    </button>
                    <button onClick={() => window.location.href = '/api/auth/github'}
                      className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-all group">
                      <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">GitHub</span>
                    </button>
                  </div>
                  <div className="relative flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-gray-300">or use email</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <InputField icon={<User className="w-4 h-4" />} name="fullName" type="text" placeholder="Full Name" value={form.fullName} onChange={handleChange} required />
                    <InputField icon={<Mail className="w-4 h-4" />} name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
                    <div className="relative">
                      <InputField icon={<Lock className="w-4 h-4" />} name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={handleChange} required />
                      <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <InputField icon={<Lock className="w-4 h-4" />} name="confirm" type="password" placeholder="Confirm Password" value={form.confirm} onChange={handleChange} required />
                    <FeedbackBlock error={error} success={success} />
                    <SubmitButton loading={loading} label="Create Account" />
                  </form>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400 font-medium">
                      Already have an account?{' '}
                      <button onClick={() => switchMode('signin')} className="text-black font-bold hover:underline">Sign in</button>
                    </p>
                  </div>
                  <SecurityBadge />
                </div>
              )}

              {/* ─── SIGN IN ─── Always custom form */}
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
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <button onClick={() => window.location.href = '/api/auth/google'}
                      className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-all group">
                      <Chrome className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">Google</span>
                    </button>
                    <button onClick={() => window.location.href = '/api/auth/github'}
                      className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-all group">
                      <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">GitHub</span>
                    </button>
                  </div>
                  <div className="relative flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-gray-300">or use email</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <InputField icon={<Mail className="w-4 h-4" />} name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
                    <div className="relative">
                      <InputField icon={<Lock className="w-4 h-4" />} name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={handleChange} required />
                      <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-bold text-gray-400 hover:text-brand-accent transition-colors">
                        Forgot Password?
                      </button>
                    </div>
                    <FeedbackBlock error={error} success={success} />
                    <SubmitButton loading={loading} label="Sign In" />
                  </form>

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

              {/* ─── FORGOT PASSWORD ─── Always custom */}
              {mode === 'forgot' && (
                <div>
                  <button onClick={() => switchMode('signin')} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors mb-8">
                    <ArrowLeft className="w-3 h-3" /> Back to Sign In
                  </button>
                  <div className="mb-6">
                    <h2 className="text-2xl font-display font-bold tracking-tighter leading-tight mb-1.5">Reset Password.</h2>
                    <p className="text-gray-400 text-xs font-medium">Enter your email to receive a recovery link.</p>
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <InputField icon={<Mail className="w-4 h-4" />} name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
                    <FeedbackBlock error={error} success={success} />
                    <SubmitButton loading={loading} label="Send Reset Link" />
                  </form>
                  <SecurityBadge />
                </div>
              )}

              {/* ─── RESET PASSWORD ─── Always custom */}
              {mode === 'reset' && (
                <div>
                  <button onClick={() => switchMode('signin')} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors mb-8">
                    <ArrowLeft className="w-3 h-3" /> Back to Sign In
                  </button>
                  <div className="mb-6">
                    <h2 className="text-2xl font-display font-bold tracking-tighter leading-tight mb-1.5">Set New Password.</h2>
                    <p className="text-gray-400 text-xs font-medium">Choose a new secure password for your account.</p>
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="relative">
                      <InputField icon={<Lock className="w-4 h-4" />} name="password" type={showPassword ? 'text' : 'password'} placeholder="New Password" value={form.password} onChange={handleChange} required />
                      <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <InputField icon={<Lock className="w-4 h-4" />} name="confirm" type="password" placeholder="Confirm Password" value={form.confirm} onChange={handleChange} required />
                    <FeedbackBlock error={error} success={success} />
                    <SubmitButton loading={loading} label="Set New Password" />
                  </form>
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

/* ─── Helper sub-components ─── */

function InputField({ icon, name, type, placeholder, value, onChange, required }) {
  return (
    <div className="group relative flex items-center gap-3 bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus-within:border-black/20 focus-within:bg-white focus-within:shadow-md focus-within:shadow-black/5 transition-all">
      <span className="text-gray-300 group-focus-within:text-black transition-colors">{icon}</span>
      <input name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
        className="flex-1 bg-transparent text-[15px] font-bold text-black placeholder-gray-300 outline-none" />
    </div>
  );
}

function SubmitButton({ loading, label }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.01 }}
      whileTap={{ scale: loading ? 1 : 0.99 }}
      className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm tracking-wide hover:bg-gray-900 transition-all shadow-xl shadow-black/20 disabled:opacity-60 flex items-center justify-center gap-3 mt-1"
    >
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : label}
    </motion.button>
  );
}

function FeedbackBlock({ error, success }) {
  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="text-red-500 text-xs font-bold bg-red-50 px-5 py-4 rounded-2xl border border-red-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />{error}
        </motion.div>
      )}
      {success && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="text-emerald-600 text-xs font-bold bg-emerald-50 px-5 py-4 rounded-2xl border border-emerald-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />{success}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SecurityBadge() {
  return (
    <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span>End-to-End Encrypted Authentication</span>
    </div>
  );
}
