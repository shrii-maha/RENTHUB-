import React, { useState, useEffect } from "react";
import { X, ShieldCheck, CreditCard, Landmark, QrCode, AlertCircle, CheckCircle, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { loadStripe } from "@stripe/stripe-js";
import { useUser } from "@clerk/clerk-react";
import { QRCodeSVG } from 'qrcode.react';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import ReceiptModal from "./ReceiptModal";
import ReviewList from "./ReviewList";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onOrderSuccess: (productId: string) => void;
}

const CheckoutForm = ({ total, onSuccess }: { total: number, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to initialize payment gateway.");
        return data;
      })
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("Invalid payment token received.");
        }
      })
      .catch((err) => {
        console.error("Payment Intent Error:", err);
        setError(err.message || "Failed to connect to payment gateway.");
      });
  }, [total]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setError(error.message || "An unexpected error occurred.");
      setProcessing(false);
    } else if (paymentIntent.status === "succeeded") {
      setProcessing(false);
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-5 bg-white border border-gray-200 rounded-2xl focus-within:border-brand-accent transition-all shadow-sm">
        <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-2 block">Card Details</label>
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#1a1a1a',
              '::placeholder': { color: '#9CA3AF' },
              fontFamily: 'Inter, sans-serif',
            },
          },
        }} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 italic">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing || (!clientSecret && !error)}
        className="w-full py-6 bg-black text-white rounded-full font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 disabled:bg-gray-400"
      >
        {processing ? (
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        ) : error ? (
          <>
            <span>Payment Unavailable</span>
            <AlertCircle className="w-6 h-6" />
          </>
        ) : (
          <>
            <span>Complete Secure Payment</span>
            <ShieldCheck className="w-6 h-6" />
          </>
        )}
      </button>
    </form>
  );
};

const UPIScanner = ({ total, product, onSuccess }: { total: number, product: Product, onSuccess: () => void }) => {
  const [vpa, setVpa] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  // Real UPI Payment URI
  // pa: Payment Address (Merchant VPA)
  // pn: Payee Name
  // am: Amount
  // cu: Currency (INR)
  // tn: Transaction Note
  const upiUri = `upi://pay?pa=renthub@upi&pn=RentHub%20Marketplace&am=${total}&cu=INR&tn=Payment%20for%20${encodeURIComponent(product.title)}`;

  const handleSimulatePayment = () => {
    setHasPaid(true);
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button 
          onClick={() => setShowQR(false)}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${!showQR ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
        >
          UPI VPA
        </button>
        <button 
          onClick={() => setShowQR(true)}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${showQR ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
        >
          Scan QR
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showQR ? (
          <motion.div 
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center flex flex-col items-center"
          >
            <div className="p-4 bg-white border-4 border-gray-50 rounded-2xl mb-4 relative overflow-hidden group">
               <QRCodeSVG value={upiUri} size={200} />
               <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 rotate-[-45deg]">Scan Me</p>
               </div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-loose">
               Scan with GPay, PhonePe or Paytm
            </p>
            <div className="flex gap-4 mt-6 grayscale opacity-30">
               <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" width="40" alt="" />
               <img src="https://img.icons8.com/color/48/000000/google-pay.png" width="24" alt="" />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="vpa"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <div className="p-5 bg-white border border-gray-200 rounded-2xl focus-within:border-brand-accent transition-all shadow-sm">
              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-2 block">VPA Address</label>
              <input 
                type="text" 
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                placeholder="e.g. srimanta@okaxis" 
                className="w-full font-bold text-lg outline-none" 
              />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase italic">* Enter your ID and you'll get a notification to pay.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={handleSimulatePayment}
        disabled={hasPaid || (!showQR && !vpa.includes('@'))}
        className="w-full py-6 bg-brand-primary text-white rounded-full font-bold text-xl hover:bg-black transition-colors flex items-center justify-center gap-3 disabled:bg-gray-200 shadow-xl shadow-brand-primary/10"
      >
        {hasPaid ? (
          <>
            <span>Payment Verified</span>
            <CheckCircle className="w-6 h-6 text-green-400" />
          </>
        ) : (
          <>
            <span>Verify & Complete</span>
            <CheckCircle className="w-6 h-6" />
          </>
        )}
      </button>
    </div>
  );
};

export default function CheckoutModal({ isOpen, onClose, product, onOrderSuccess }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'bank'>('card');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isOpen && product && user) {
      setLoadingReviews(true);
      fetch(`/api/reviews/listing/${product.id}`)
        .then(res => res.json())
        .then(data => {
          setReviews(Array.isArray(data) ? data : []);
        })
        .catch(console.error)
        .finally(() => setLoadingReviews(false));
    }
  }, [isOpen, product, user]);

  if (!isLoaded || !user || !product) return null;

  const numericPrice = parseInt(product.price.replace(/[^\d]/g, '')) || 0;
  const serviceFee = Math.floor(numericPrice * 0.05);
  const securityDeposit = product.type === 'Rent' ? Math.floor(numericPrice * 0.2) : 0;
  const total = numericPrice + serviceFee + securityDeposit;

  const handleOrderCreation = async () => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: product.id,
          buyerId: user?.primaryEmailAddress?.emailAddress || "guest",
          sellerId: product.sellerId,
          amount: total,
          paymentMethod: paymentMethod,
          status: 'escrow'
        }),
      });
      const data = await res.json();
      return data._id;
    } catch (err) {
      console.error("Failed to save order", err);
      return "ORDER-PREVIEW";
    }
  };

  const handleSuccess = async () => {
    const orderId = await handleOrderCreation();
    setCreatedOrderId(orderId);
    if (product) {
      onOrderSuccess(product.id);
    }
    setIsReceiptOpen(true);
  };

  const closeEverything = () => {
    setIsReceiptOpen(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
            className="relative w-full max-w-6xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]"
          >
            {/* LEFT SIDE: PAYMENT SELECTION */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-display font-bold tracking-tight italic">Secure <span className="text-brand-accent">Checkout</span>.</h2>
                <button onClick={closeEverything} className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col gap-4 mb-8">
                <div 
                  onClick={() => setPaymentMethod('card')}
                  className={`p-6 border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'card' ? 'border-brand-accent bg-gray-50 shadow-inner shadow-brand-accent/5' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-colors ${
                      paymentMethod === 'card' ? 'border-brand-accent' : 'border-gray-200'
                    }`}>
                      {paymentMethod === 'card' && <div className="w-3 h-3 bg-brand-accent rounded-full" />}
                    </div>
                    <span className="font-bold flex items-center gap-2">
                       <CreditCard className="w-5 h-5" /> 
                       Card (Stripe)
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-50">
                    <img src="https://img.icons8.com/color/48/000000/visa.png" width="30"/>
                    <img src="https://img.icons8.com/color/48/000000/mastercard.png" width="30"/>
                  </div>
                </div>

                <div 
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-6 border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'upi' ? 'border-brand-accent bg-gray-50 shadow-inner shadow-brand-accent/5' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-colors ${
                      paymentMethod === 'upi' ? 'border-brand-accent' : 'border-gray-200'
                    }`}>
                      {paymentMethod === 'upi' && <div className="w-3 h-3 bg-brand-accent rounded-full" />}
                    </div>
                    <span className={`font-bold flex items-center gap-2`}>
                      <QrCode className="w-5 h-5 text-gray-400" />
                      UPI Scanning
                    </span>
                  </div>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" width="45" />
                </div>
              </div>

              {paymentMethod === 'card' ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm total={total} onSuccess={handleSuccess} />
                </Elements>
              ) : (
                <UPIScanner product={product} total={total} onSuccess={handleSuccess} />
              )}

              <p className="text-center text-gray-400 text-[10px] mt-8 flex items-center justify-center gap-2 uppercase tracking-[0.2em] font-bold">
                <ShieldCheck className="w-4 h-4 text-brand-accent" />
                Guaranteed by RentHub AI
              </p>
            </div>

            {/* RIGHT SIDE: ORDER SUMMARY */}
            <div className="w-full md:w-[480px] bg-brand-muted/10 p-8 md:p-12 border-l border-gray-100 bg-gradient-to-b from-brand-muted/20 to-white">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold uppercase tracking-widest text-brand-primary/30">Summary.</h3>
                <button onClick={closeEverything} className="p-2 hover:bg-gray-200 rounded-full transition-colors hidden md:block">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-6 mb-8 pb-10 border-b border-gray-200">
                <img src={product.image} className="w-28 h-28 object-cover rounded-[2rem] shadow-xl border-4 border-white transform hover:rotate-2 transition-transform" alt="" />
                <div className="pt-2">
                  <div className="font-bold text-2xl mb-1 leading-none">{product.title}</div>
                  <div className="text-[10px] text-brand-primary/40 uppercase font-mono tracking-[0.2em] mt-2 block">
                    {product.type === 'Rent' ? 'RentHub Rental' : 'Market Purchase'}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 uppercase tracking-widest text-[9px] font-bold">Base Price</span>
                  <span className="font-bold">₹{numericPrice.toLocaleString()}</span>
                </div>
                {product.type === 'Rent' && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 uppercase tracking-widest text-[9px] font-bold">Security Deposit</span>
                    <span className="font-bold">₹{securityDeposit.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 uppercase tracking-widest text-[9px] font-bold">Processing Fee</span>
                  <span className="font-bold">₹{serviceFee.toLocaleString()}</span>
                </div>

                <div className="pt-10 mt-6 border-t border-gray-200 relative">
                  <div className="absolute -top-[1px] left-0 w-8 h-[2px] bg-brand-accent" />
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-2">Grand Total</span>
                    <span className="text-5xl font-display font-bold text-brand-primary">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-8 bg-brand-primary text-white rounded-[3rem] shadow-2xl shadow-brand-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-accent/20 transition-all" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="w-7 h-7 text-brand-accent" />
                    </div>
                    <div>
                      <div className="font-bold text-lg leading-tight uppercase tracking-tight">Purchase Protect.</div>
                      <div className="text-[9px] text-white/30 uppercase tracking-[0.5em] block">Certified Security</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed italic">
                    Funds are placed in a secure escrow account until delivery is confirmed. You're 100% protected against fraud.
                  </p>
                </div>
              </div>

              {/* REVIEWS SECTION */}
              <div className="mt-12 pt-12 border-t border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-brand-primary/30">Honest Trust.</h3>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-primary/5 rounded-full border border-brand-primary/10">
                    <Star className="w-3 h-3 fill-brand-accent text-brand-accent" />
                    <span className="text-[10px] font-bold text-brand-primary">
                      {product.rating > 0 ? `${product.rating} (Listing)` : 'No Reviews Yet'}
                    </span>
                  </div>
                </div>

                {/* Seller Trust Profile */}
                <div className="bg-brand-primary/5 rounded-3xl p-6 border border-brand-primary/10 mb-8 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ShieldCheck className="w-12 h-12" />
                   </div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">Seller Reputation</span>
                         {product.sellerStats?.isVerified && (
                           <div className="flex items-center gap-1 px-2 py-0.5 bg-brand-accent text-brand-primary rounded text-[8px] font-black uppercase">
                              Verified
                           </div>
                         )}
                      </div>
                      <div className="flex items-baseline gap-2 mb-1">
                         <span className="text-3xl font-display font-bold">{product.sellerStats?.avgRating || '0.0'}</span>
                         <span className="text-sm font-bold text-brand-primary/40">★ Seller Score</span>
                      </div>
                      <p className="text-[11px] font-medium text-brand-primary/60 leading-relaxed mb-4">
                         {product.sellerStats?.salesCount || 0} Successful Transactions Completed.
                      </p>
                      
                      <div className="p-3 bg-white/50 rounded-xl border border-brand-primary/5">
                         <p className="text-[9px] font-bold text-brand-primary/30 uppercase tracking-tighter leading-snug">
                            "This product is unique and has no reviews yet. You can trust this seller based on their proven track record across all past listings."
                         </p>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-brand-primary/30">Past Feedback.</h3>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {loadingReviews ? (
                    <div className="flex justify-center py-10 opacity-20">
                      <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <ReviewList reviews={reviews} />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          {isReceiptOpen && (
            <ReceiptModal 
              isOpen={isReceiptOpen} 
              onClose={closeEverything} 
              product={product} 
              orderId={createdOrderId} 
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
