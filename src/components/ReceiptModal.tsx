import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink } from "lucide-react";
import { Product } from "../types";
import { useAuth } from "../contexts/AuthContext";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  orderId: string;
}

export default function ReceiptModal({ isOpen, onClose, product, orderId }: ReceiptModalProps) {
  const { user } = useAuth();
  if (!product) return null;

  const numericPrice = parseInt(product.price.replace(/[^\d]/g, '')) || 0;
  const serviceFee = Math.floor(numericPrice * 0.05);
  const securityDeposit = product.type === 'Rent' ? Math.floor(numericPrice * 0.2) : 0;
  const total = numericPrice + serviceFee + securityDeposit;

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const userName = user?.fullName || "Guest User";
  const userEmail = user?.email || "";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[1.5rem] overflow-hidden shadow-2xl z-10 p-6 md:p-12 font-sans"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Close Button Mobile/Global */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo & Header */}
            <div className="flex justify-between items-center mb-12 mt-2">
              <div className="flex items-center gap-2.5">
                <div className="bg-black w-8 h-8 rounded-full flex items-center justify-center text-white font-black font-serif text-lg">
                  R
                </div>
                <span className="text-xl font-extrabold font-serif tracking-tight">RentHub</span>
              </div>
              <div className="text-right mr-10">
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Invoice No.</div>
                <div className="font-bold text-black border-none select-all">#{orderId || "RH-88219"}</div>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold mb-8 italic text-brand-primary">Payment <span className="text-brand-accent">Receipt</span></h2>

            <div className="grid grid-cols-2 gap-10 mb-10">
              <div>
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-2">Billed To</div>
                <div className="font-bold text-black">{userName}</div>
                <div className="text-[13px] text-gray-500">{userEmail}</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-2">Date</div>
                <div className="font-bold text-black">{today}</div>
              </div>
            </div>

            {/* Bill Table */}
            <div className="border-t-2 border-black py-6 mb-5">
              <div className="flex justify-between mb-4">
                <div className="font-bold">{product.title} {product.type === 'Rent' && '(Rental)'}</div>
                <div className="font-bold">₹{numericPrice.toLocaleString()}</div>
              </div>
              {product.type === 'Rent' && (
                <div className="flex justify-between mb-4 text-gray-500 text-sm">
                  <div>Security Deposit (Refundable)</div>
                  <div>₹{securityDeposit.toLocaleString()}</div>
                </div>
              )}
              <div className="flex justify-between text-gray-500 text-sm">
                <div>Service Fee</div>
                <div>₹{serviceFee.toLocaleString()}</div>
              </div>
            </div>

            {/* Total Area */}
            <div className="bg-gray-50 p-6 rounded-2xl flex justify-between items-center shadow-inner border border-gray-100">
              <div className="font-extrabold text-lg text-black">Total Amount Paid</div>
              <div className="text-3xl font-black text-black">₹{total.toLocaleString()}</div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 text-center text-gray-400 text-xs font-medium">
              {product.type === 'Rent' 
                ? "Your security deposit will be auto-refunded within 24 hours of item return." 
                : "Thank you for shopping with RentHub. Your digital ownership has been transferred."
              }
              <div className="mt-4 flex justify-center gap-4">
                 <button onClick={onClose} className="text-black font-bold flex items-center gap-1 hover:underline">
                    Find more items <ExternalLink className="w-3 h-3" />
                 </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
