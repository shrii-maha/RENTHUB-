import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Send, ShieldCheck, MessageSquare } from 'lucide-react';

export default function ReviewModal({ isOpen, onClose, order, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please share a brief comment about your experience.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          listingId: order.listingId._id || order.listingId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          rating,
          comment
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to submit review");

      onReviewSubmitted(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 pb-0 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-accent mb-2 block">Feedback Portal</span>
              <h2 className="text-3xl font-display font-bold italic tracking-tight text-black">
                Rate & <span className="text-brand-accent">Review</span>.
              </h2>
            </div>
            <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-8">
            {/* Interactive Stars */}
            <div className="bg-brand-muted/10 p-8 rounded-[2rem] text-center border border-brand-primary/5">
              <p className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest mb-4">How was your experience?</p>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform active:scale-95"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        (hover || rating) >= star 
                          ? 'fill-brand-accent text-brand-accent animate-pulse' 
                          : 'text-gray-200'
                      } transition-colors duration-200`}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs font-bold text-brand-accent">
                {rating === 5 ? 'Exceptional!' : rating === 4 ? 'Great Service' : rating === 3 ? 'Good' : rating === 2 ? 'Could be better' : 'Disappointing'}
              </p>
            </div>

            {/* Comment Field */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Detailed Review
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you think of the product and the seller's communication?"
                className="w-full h-32 px-6 py-4 bg-gray-50 rounded-[1.5rem] border-2 border-transparent focus:border-brand-accent focus:bg-white outline-none transition-all text-sm font-medium resize-none shadow-inner"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 rounded-2xl text-[11px] font-bold text-red-500 uppercase tracking-widest border border-red-100 italic">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-black text-white rounded-[1.5rem] font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Submit Review</span>
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 pt-2">
              <ShieldCheck className="w-4 h-4 text-brand-accent" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified Purchase Feedback</span>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
