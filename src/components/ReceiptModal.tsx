import React, { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, Download, ShieldCheck, Printer } from "lucide-react";
import { Product } from "../types";
import { useAuth } from "../contexts/AuthContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  order: any;
}

export default function ReceiptModal({ isOpen, onClose, product, order }: ReceiptModalProps) {
  const { user } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  if (!product || !order) return null;

  const numericPrice = typeof product.price === 'string' 
    ? parseInt(product.price.replace(/[^\d]/g, '')) || 0 
    : product.price;

  const serviceFee = Math.floor(numericPrice * 0.05);
  const securityDeposit = product.type === 'Rent' ? Math.floor(numericPrice * 0.2) : 0;
  const total = numericPrice + serviceFee + securityDeposit;

  const today = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const userName = user?.fullName || "Guest User";
  const userEmail = user?.email || "";

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`RentHub_Invoice_${order.invoiceNumber || order._id}.pdf`);
    } catch (err) {
      console.error("PDF Generation failed:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-y-auto">
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
            className="relative w-full max-w-3xl my-8 z-10 flex flex-col gap-4"
          >
            {/* Header Actions */}
            <div className="flex justify-between items-center px-2">
              <div className="flex gap-2">
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-black/20"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-black border border-gray-200 rounded-full font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div 
              ref={receiptRef}
              className="bg-white rounded-[2rem] overflow-hidden shadow-2xl p-10 md:p-16 relative"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Watermark/Background element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
              
              {/* Logo & Status */}
              <div className="flex justify-between items-start mb-16 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-black w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black font-serif text-2xl shadow-lg">
                    R
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold font-serif tracking-tight block">RentHub</span>
                    <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-[0.2em]">Marketplace Platform</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 inline-block ${
                    order.status === 'paid' || order.status === 'released' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {order.status === 'released' || order.status === 'paid' ? 'Invoice Paid' : 'Payment Escrowed'}
                  </div>
                  <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Invoice Number</div>
                  <div className="font-mono font-bold text-black text-sm">{order.invoiceNumber || `INV-${order._id.slice(-8).toUpperCase()}`}</div>
                </div>
              </div>

              <h2 className="text-4xl font-display font-bold mb-12 italic text-black tracking-tight">Official <span className="text-brand-accent underline decoration-brand-accent/30 underline-offset-8">Receipt</span>.</h2>

              <div className="grid grid-cols-2 gap-16 mb-12">
                <div>
                  <div className="text-[11px] text-gray-400 font-extrabold uppercase tracking-widest mb-3">Billing Details</div>
                  <div className="font-bold text-black text-lg mb-1">{userName}</div>
                  <div className="text-[14px] text-gray-500 font-medium">{userEmail}</div>
                  {order.deliveryMethod && (
                    <div className="mt-4 text-[12px] text-gray-400 font-medium italic">Method: {order.deliveryMethod}</div>
                  )}
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 font-extrabold uppercase tracking-widest mb-3">Transaction Info</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Issue Date</span>
                      <span className="font-bold text-black">{today}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Order Reference</span>
                      <span className="font-mono font-bold text-black text-xs">#{order._id.slice(-12).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Payment Method</span>
                      <span className="font-bold text-black uppercase">{order.paymentMethod || 'Stripe/Card'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-10">
                <div className="bg-gray-50 rounded-t-2xl p-4 grid grid-cols-[1fr_120px] gap-4">
                  <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Asset Description</div>
                  <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Amount</div>
                </div>
                <div className="border-x border-gray-100 p-6 space-y-6">
                  <div className="grid grid-cols-[1fr_120px] gap-4">
                    <div>
                      <div className="font-bold text-black text-base">{product.title}</div>
                      <div className="text-xs text-gray-400 mt-1">{product.category} • {product.type} Asset</div>
                    </div>
                    <div className="text-right font-bold text-black">₹{numericPrice.toLocaleString()}</div>
                  </div>
                  
                  {product.type === 'Rent' && (
                    <div className="grid grid-cols-[1fr_120px] gap-4 text-gray-500 text-sm italic">
                      <div>Security Deposit (Refundable)</div>
                      <div className="text-right">₹{securityDeposit.toLocaleString()}</div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-[1fr_120px] gap-4 text-gray-500 text-sm">
                    <div>Platform Service Fee (5%)</div>
                    <div className="text-right">₹{serviceFee.toLocaleString()}</div>
                  </div>
                </div>
                
                {/* Total Footer */}
                <div className="bg-black text-white p-8 rounded-b-2xl flex justify-between items-center shadow-xl">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/40 mb-1">Total Amount Disbursed</div>
                    <div className="text-xs text-white/60 font-medium italic">Inclusive of all applicable taxes</div>
                  </div>
                  <div className="text-4xl font-display font-bold tracking-tighter">₹{total.toLocaleString()}</div>
                </div>
              </div>

              <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3 text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest">Digitally Verified Asset</span>
                </div>
                <div className="text-center md:text-right max-w-xs">
                  <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                    {product.type === 'Rent' 
                      ? "Security deposit is held in a protected escrow and will be refunded upon verified asset return." 
                      : "This receipt serves as a digital proof of ownership transfer for the specified asset."
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
