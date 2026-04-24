import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';

export default function ResetPasswordModal({ isOpen, onClose, resetToken }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      
      setSuccess('Password reset successfully. You can now log in.');
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 32 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-accent via-yellow-400 to-brand-accent animate-gradient-x" />

            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-black/5 text-black/20 hover:text-black transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pt-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-black/20">R</div>
                <span className="text-2xl font-display font-bold tracking-tighter">RentHub</span>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold tracking-tighter leading-tight mb-1.5">New Password.</h2>
                <p className="text-gray-400 text-xs font-medium">Please enter your new password below.</p>
              </div>

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

              {!success && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">New Password</label>
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 text-white rounded-xl font-bold py-3.5 shadow-xl shadow-black/20 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save New Password
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
