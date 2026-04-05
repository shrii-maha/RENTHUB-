import React from 'react';
import { Star, User, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export default function ReviewList({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[2rem] p-12 text-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Star className="w-8 h-8 text-gray-200" />
        </div>
        <h4 className="text-lg font-bold text-gray-400 italic">No reviews yet.</h4>
        <p className="text-xs text-gray-300 uppercase tracking-widest mt-1">Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review, index) => (
        <motion.div
          key={review._id || index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-muted text-brand-primary rounded-2xl flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-black text-sm uppercase tracking-tight">
                  {review.buyerId.split('@')[0]}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Calendar className="w-3 h-3 text-gray-300" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-1 bg-brand-accent/10 px-3 py-1.5 rounded-full">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${s <= review.rating ? 'fill-brand-accent text-brand-accent' : 'text-gray-200'}`}
                />
              ))}
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed italic font-medium pl-2 border-l-2 border-brand-accent/20">
            "{review.comment}"
          </p>
        </motion.div>
      ))}
    </div>
  );
}
