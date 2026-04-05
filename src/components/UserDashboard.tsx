import React, { useState, useEffect } from "react";
import { X, LayoutDashboard, ShoppingBag, Wallet, LogOut, Plus, ChevronRight, CheckCircle2, Clock, Landmark, ArrowUpRight, ShieldCheck, MoreHorizontal, Camera, Box, Heart, Rocket, Pencil, Trash2, Truck, PackageCheck, Star } from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import ReceiptModal from "./ReceiptModal";
import ReviewModal from "./ReviewModal";

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Product[];
  onOpenSell: () => void;
}

type Tab = 'dashboard' | 'listings' | 'purchases' | 'earnings';

export default function UserDashboard({ isOpen, onClose, listings, onOpenSell }: UserDashboardProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
  const [userListings, setUserListings] = useState<Product[]>([]);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any>(null);

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = userEmail === import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    if (isOpen && userEmail && !isAdmin) {
      // Fetch Seller Payouts/Orders using Clerk User ID
      if (user?.id) {
        fetch(`/api/orders/seller/${user.id}`)
          .then(res => res.json())
          .then(data => setOrders(Array.isArray(data) ? data : []))
          .catch(console.error);
      }

      // Fetch Buyer Orders
      fetch(`/api/orders/buyer/${userEmail}`)
        .then(res => res.json())
        .then(data => setBuyerOrders(Array.isArray(data) ? data : []))
        .catch(console.error);

      // Fetch Seller's own listings (including sold/rented)
      if (user?.id) {
        fetch(`/api/listings/seller/${user.id}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setUserListings(data.map((item: any) => ({
                ...item,
                id: item._id || item.id
              })));
            }
          })
          .catch(console.error);
      }
    }
  }, [isOpen, userEmail, isAdmin, user?.id]);

  if (!user || isAdmin) return null;

  // Remove redundant filter: const userListings = listings.filter(l => l.sellerId === user.id);
  const activeRentals = userListings.filter(l => l.status === 'rented').length;
  
  // Calculate Real Earnings from Orders
  let availableBalance = 0;
  let pendingEarnings = 0;
  let processingBalance = 0;
  let lifetimePaid = 0;

  orders.forEach(order => {
    const listing = order.listingId;
    if (!listing) return;
    const basePrice = parseInt(listing.price.replace(/[^\d]/g, '')) || 0;
    const netPayout = listing.type === 'Sale' ? basePrice * 0.95 : basePrice * 0.85;
    
    if (order.status === 'escrow' || order.status === 'shipped') {
      pendingEarnings += netPayout;
    } else if (order.status === 'released') {
      availableBalance += netPayout;
    } else if (order.status === 'payout_requested') {
      processingBalance += netPayout;
    } else if (order.status === 'paid') {
      lifetimePaid += netPayout;
    }
  });

  const handleWithdrawRequest = async () => {
    if (availableBalance <= 0) return;
    setRequestingPayout(true);
    try {
      const res = await fetch(`/api/payouts/request/${userEmail}`, { method: 'POST' });
      if (res.ok) {
        // Optimistically update orders or refetch
        setOrders(prev => prev.map(o => o.status === 'released' ? { ...o, status: 'payout_requested' } : o));
      }
    } finally {
      setRequestingPayout(false);
    }
  };

  const rawEarnings = availableBalance + pendingEarnings + processingBalance + lifetimePaid;

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-12 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="relative w-full max-w-6xl h-full md:h-[85vh] bg-white md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* SIDEBAR */}
            <div className="w-full md:w-64 bg-black p-6 md:p-10 flex flex-col justify-between">
              <div>
                <div className="flex flex-col mb-12 pl-2">
                  <span className="text-white font-display font-bold italic text-3xl tracking-tighter">UserHub.</span>
                  <span className="text-[9px] text-[#FDFDFD]/40 font-mono tracking-[0.20em] uppercase mt-1 font-extrabold">Seller Dashboard</span>
                </div>

                <nav className="flex flex-col gap-2">
                  <SidebarItem 
                    icon={<LayoutDashboard className="w-5 h-5" />} 
                    label="Dashboard" 
                    active={activeTab === 'dashboard'} 
                    onClick={() => handleTabChange('dashboard')} 
                  />
                  <SidebarItem 
                    icon={<Box className="w-5 h-5" />} 
                    label="My Listings" 
                    active={activeTab === 'listings'} 
                    onClick={() => handleTabChange('listings')} 
                  />
                  <SidebarItem 
                    icon={<ShoppingBag className="w-5 h-5" />} 
                    label="My Purchases" 
                    active={activeTab === 'purchases'} 
                    onClick={() => handleTabChange('purchases')} 
                  />
                  <SidebarItem 
                    icon={<Wallet className="w-5 h-5" />} 
                    label="Earnings" 
                    active={activeTab === 'earnings'} 
                    onClick={() => handleTabChange('earnings')} 
                  />
                </nav>
              </div>

              <div className="pt-8 border-t border-white/10 mt-8">
                <button 
                  onClick={() => signOut({ redirectUrl: '/' })}
                  className="flex items-center gap-4 p-4 w-full text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-2xl font-bold cursor-pointer transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 bg-[#FDFDFD] flex flex-col overflow-hidden">
              {/* Common Header */}
              <div className="p-8 md:p-12 pb-0 flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                  <h1 className="text-[34px] font-display font-bold leading-none mb-1 italic tracking-tight text-black">
                    {activeTab === 'dashboard' ? 'Welcome back,' : activeTab === 'earnings' ? 'My Earnings.' : activeTab === 'purchases' ? 'My Purchases.' : 'Manage Listings.'}
                  </h1>
                  <p className="text-brand-primary/40 text-xs font-medium tracking-wide">
                    {activeTab === 'dashboard' ? 'Track your performance and manage item listings.' : activeTab === 'earnings' ? 'Manage your payouts and transparent history.' : activeTab === 'purchases' ? 'Items you bought or rented.' : 'Track and manage your marketplace assets.'}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={onOpenSell} className="px-8 py-3.5 bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-black/10 hover:scale-105 transition-all flex items-center gap-3">
                    <Plus className="w-5 h-5" /> New Listing
                  </button>
                  <button onClick={onClose} className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">
                    <X className="w-6 h-6 text-black" />
                  </button>
                </div>
              </div>

              {/* View Rendering */}
              <div className="flex-1 p-8 md:p-12 pt-10 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {activeTab === 'dashboard' && (
                    <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <StatsRow listingsCount={userListings.filter(l => l.status === 'approved').length} rentalsCount={userListings.filter(l => l.status === 'rented').length} earnings={rawEarnings} />
                      <ListingsGrid listings={userListings} />
                    </motion.div>
                  )}

                  {activeTab === 'earnings' && (
                    <motion.div key="earnings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <EarningsSummary 
                        balance={availableBalance} 
                        pending={pendingEarnings} 
                        totalPaid={lifetimePaid} 
                        processing={processingBalance}
                        onWithdraw={() => handleWithdrawRequest()}
                        isRequesting={requestingPayout}
                      />
                      <TransactionHistory orders={orders} setOrders={setOrders} />
                    </motion.div>
                  )}

                  {activeTab === 'listings' && (
                    <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <ListingsGrid listings={userListings} showFilters={true} />
                    </motion.div>
                  )}

                  {activeTab === 'purchases' && (
                    <motion.div key="purchases" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <PurchasesGrid 
                        orders={buyerOrders} 
                        setBuyerOrders={setBuyerOrders} 
                        onViewSource={(order: any) => setReceiptData({ product: order.listingId, orderId: order._id })} 
                        onOpenReview={(order: any) => {
                          setSelectedOrderForReview(order);
                          setIsReviewModalOpen(true);
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
          
          {receiptData && (
            <ReceiptModal 
              isOpen={true} 
              onClose={() => setReceiptData(null)} 
              product={receiptData.product} 
              orderId={receiptData.orderId} 
            />
          )}

          {isReviewModalOpen && selectedOrderForReview && (
            <ReviewModal
              isOpen={isReviewModalOpen}
              onClose={() => setIsReviewModalOpen(false)}
              order={selectedOrderForReview}
              onReviewSubmitted={() => {
                // Optionally update UI to show "Reviewed" status
                setBuyerOrders(prev => prev.map(o => o._id === selectedOrderForReview._id ? { ...o, reviewed: true } : o));
              }}
            />
          )}

        </div>
      )}
    </AnimatePresence>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-2xl font-bold cursor-pointer transition-all group ${
        active ? 'bg-brand-accent text-brand-primary shadow-xl shadow-brand-accent/10' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto opacity-40 group-hover:translate-x-1 transition-transform" />}
    </div>
  );
}

function StatsRow({ listingsCount, rentalsCount, earnings }: { listingsCount: number, rentalsCount: number, earnings: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
      <StatCard label="Total Earnings" value={`₹${earnings.toLocaleString()}`} sub="Live Platform Volume" subColor="text-green-500" />
      <StatCard label="Active Items" value={`${listingsCount} Items`} sub={`${rentalsCount} Rented`} subColor="text-blue-500" />
      <StatCard label="Item Views" value="842" sub="Growing Trend!" subColor="text-brand-accent" />
    </div>
  );
}

function StatCard({ label, value, sub, subColor }: { label: string, value: string, sub: string, subColor: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:bg-gray-50">
      <span className="text-[10px] font-mono uppercase tracking-widest text-brand-primary/30 font-bold">{label}</span>
      <div className="text-2xl font-display font-bold mt-3 mb-1 tracking-tight">{value}</div>
      <div className={`text-[9px] font-bold ${subColor} uppercase tracking-widest`}>{sub}</div>
    </div>
  );
}

function EarningsSummary({ balance, pending, totalPaid, processing, onWithdraw, isRequesting }: { balance: number, pending: number, totalPaid: number, processing: number, onWithdraw: () => void, isRequesting: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div className="md:col-span-1.5 bg-black text-white p-10 rounded-[2.8rem] shadow-2xl shadow-black/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-accent/10 transition-all duration-700" />
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-white/30">Available for Payout</span>
            <div className="text-5xl font-display font-bold mt-6 tracking-tighter italic">₹{balance.toLocaleString()}.00</div>
          </div>
          {balance > 0 && (
            <button 
              onClick={onWithdraw}
              disabled={isRequesting}
              className="px-6 py-3 bg-brand-accent text-brand-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-brand-accent/20"
            >
              {isRequesting ? 'Processing...' : 'Withdraw Now'}
            </button>
          )}
        </div>
        <div className="mt-8 flex items-center gap-3">
           <div className={`w-2 h-2 ${balance > 0 ? 'bg-brand-accent animate-ping' : 'bg-white/20'} rounded-full`} />
           <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
             {processing > 0 ? `₹${processing.toLocaleString()} currently processing` : 'Live Balance'}
           </span>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-gray-400">Escrow / Pending</span>
          <div className="text-3xl font-display font-bold mt-4 text-black tracking-tight italic">₹{pending.toLocaleString()}</div>
        </div>
        <div className="mt-6 text-[9px] font-bold text-brand-accent bg-orange-50 px-3 py-1.5 rounded-full uppercase tracking-widest inline-block w-fit">
          Secured Funds
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-gray-400">Lifetime Paid</span>
          <div className="text-3xl font-display font-bold mt-4 text-black tracking-tight italic">₹{totalPaid.toLocaleString()}</div>
        </div>
        <div className="mt-6 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Successfully Disbursed</div>
      </div>
    </div>
  );
}

function TransactionHistory({ orders, setOrders }: { orders: any[], setOrders: React.Dispatch<React.SetStateAction<any[]>> }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white border md:border-dashed border-gray-100 rounded-[3rem] overflow-hidden p-16 text-center shadow-sm">
        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-100">
          <Wallet className="w-10 h-10 text-gray-200" />
        </div>
        <h3 className="text-2xl font-display font-bold italic text-black mb-2">No Transactions.</h3>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">Once your items are sold or rented, your payouts will reflect here in real-time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-6 pl-2">Recent Ledger Activity</h3>
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => {
          const listing = order.listingId;
          const title = listing?.title || "Product Listing";
          const type = listing?.type || "Sale";
          const basePrice = parseInt(listing?.price?.replace(/[^\d]/g, '')) || 0;
          const feePercent = type === 'Sale' ? 5 : 15;
          const platformFee = Math.floor(basePrice * (feePercent / 100));
          const netPayout = basePrice - platformFee;
          const isEscrow = order.status === 'escrow';

          return (
            <div key={order._id} className="bg-white p-6 rounded-[2.2rem] border border-gray-50 flex flex-col gap-4 group hover:shadow-xl transition-all shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 group-hover:rotate-3 transition-transform overflow-hidden">
                  {listing?.image ? <img src={listing.image} alt="" className="w-full h-full object-cover" /> : <Box className="w-6 h-6 text-gray-300" />}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-[17px] font-bold text-black group-hover:text-brand-accent transition-colors truncate">{title}</h4>
                      <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border ${
                        order.status === 'escrow' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                        order.status === 'shipped' ? 'bg-blue-50 text-blue-500 border-blue-100' :
                        order.status === 'payout_requested' ? 'bg-amber-50 text-amber-500 border-amber-100 animate-pulse' :
                        order.status === 'paid' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                        'bg-green-50 text-green-500 border-green-100'
                      }`}>
                        {order.status === 'escrow' ? 'Held in Escrow' : 
                         order.status === 'shipped' ? '🚚 Shipped' : 
                         order.status === 'payout_requested' ? '⏳ Payout Processing' :
                         order.status === 'paid' ? '💰 Payout Completed' :
                         '✅ Released'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                       <span>REF: RT-{order._id.slice(-6).toUpperCase()}</span>
                       <span className="opacity-20">•</span>
                       <span>{type} Asset</span>
                    </div>
                </div>
                <div className="flex items-center gap-10 md:pl-10 md:border-l border-gray-100">
                    <div className="text-right">
                       <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Net Payout</span>
                       <div className="text-2xl font-display font-bold italic text-black leading-none">₹{netPayout.toLocaleString()}</div>
                    </div>
                </div>
              </div>
              {/* SELLER ACTION: Mark as Shipped */}
              {order.status === 'escrow' && (
                <ShipOrderPanel orderId={order._id} onShipped={() => {
                  setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: 'shipped' } : o));
                }} />
              )}
              {order.status === 'shipped' && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                  <Truck className="w-4 h-4" />
                  <span>Shipped{order.trackingNumber ? ` — Tracking: ${order.trackingNumber}` : ''}. Waiting for buyer to confirm delivery.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListingsGrid({ listings, showFilters }: { listings: Product[], showFilters?: boolean }) {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Rented'>('All');
  
  const filtered = listings.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Active') return item.type === 'Sale';
    if (filter === 'Rented') return item.type === 'Rent';
    return true;
  });

  return (
    <div className="space-y-8">
      {showFilters && (
        <div className="flex justify-end gap-2">
           <button onClick={() => setFilter('All')} className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${filter === 'All' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
             All ({listings.length})
           </button>
           <button onClick={() => setFilter('Active')} className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${filter === 'Active' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
             Active ({listings.filter(l => l.type === 'Sale').length})
           </button>
           <button onClick={() => setFilter('Rented')} className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${filter === 'Rented' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
             Rented ({listings.filter(l => l.type === 'Rent').length})
           </button>
        </div>
      )}

    <div className="grid grid-cols-1 gap-5">
        {filtered.length === 0 ? (
           <div className="col-span-full py-16 text-center text-gray-400 italic font-medium bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
             No items found matching your filter.
           </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-white border border-gray-50 rounded-[1.8rem] p-5 flex items-center gap-6 group hover:shadow-xl transition-all shadow-sm">
              <div className="w-28 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 relative border border-gray-100 shadow-sm">
                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                <div className="absolute inset-0 bg-black/5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-black uppercase tracking-tight truncate group-hover:text-brand-accent transition-colors mb-1">{item.title}</h4>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono font-extrabold uppercase tracking-widest">
                    <span>{item.category}</span>
                    <span className="opacity-20">•</span>
                    <span>{item.location}</span>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border transition-all shadow-sm ${
                    item.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                    item.status === 'pending' || !item.status ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                    item.status === 'sold' || item.status === 'rented' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {item.status === 'approved' ? <ShieldCheck className="w-3 h-3" /> : (item.status === 'pending' || !item.status) ? <Clock className="w-3 h-3" /> : <Box className="w-3 h-3" />}
                    {item.status || 'pending'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-all" title="Promote">
                  <Rocket className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition-all" title="Edit">
                  <Pencil className="w-4 h-4" strokeWidth={2.5}/>
                </button>
                <button className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-500 transition-all border border-red-100" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PurchasesGrid({ orders, setBuyerOrders, onViewSource, onOpenReview }: { 
  orders: any[], 
  setBuyerOrders: React.Dispatch<React.SetStateAction<any[]>>, 
  onViewSource?: (order: any) => void,
  onOpenReview: (order: any) => void 
}) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm p-12 text-center mt-8">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <ShoppingBag className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold italic text-black mb-1">No purchases yet.</h3>
        <p className="text-gray-400 text-sm">When you buy or rent items, they will securely appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
      {orders.map((order) => {
        const listing = order.listingId;
        const title = listing?.title || "Unknown Asset";
        const type = listing?.type || "Sale";

        return (
          <div key={order._id} className="bg-white p-5 rounded-[20px] border border-gray-100 font-sans shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200">
                {listing?.image ? (
                  <img src={listing.image} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100"><Box className="w-6 h-6 text-gray-400"/></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="m-0 text-base font-bold text-black leading-tight truncate">{title}</h4>
                    <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0 ${
                      order.status === 'escrow' ? 'bg-orange-50 text-orange-600' :
                      order.status === 'shipped' ? 'bg-blue-50 text-blue-600' :
                      order.status === 'released' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                    }`}>
                      {order.status === 'escrow' ? '⏳ Payment Secured' : order.status === 'shipped' ? '🚚 On the Way' : '✅ Delivered'}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium tracking-wide mb-1">Ref: #{order._id.slice(-6).toUpperCase()} • {type}</div>
                  <div className="font-bold text-black text-sm">₹{order.amount.toLocaleString()}.00</div>
              </div>
            </div>
            {/* Tracking info if shipped */}
            {order.status === 'shipped' && order.trackingNumber && (
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                <Truck className="w-4 h-4 shrink-0" />
                <span>Tracking: <strong>{order.trackingNumber}</strong>{order.shippingNote ? ` — ${order.shippingNote}` : ''}</span>
              </div>
            )}
            {/* BUYER ACTION: Confirm Delivery */}
            {(order.status === 'shipped' || order.status === 'escrow') && (
              <ConfirmDeliveryButton orderId={order._id} onConfirmed={() => {
                setBuyerOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: 'released' } : o));
              }} />
            )}
            {order.status === 'released' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-4 py-2 rounded-xl">
                  <PackageCheck className="w-4 h-4" />
                  <span>Delivery confirmed. Payment released to seller.</span>
                </div>
                {!order.reviewed && (
                  <button 
                    onClick={() => onOpenReview(order)}
                    className="flex items-center justify-center gap-2 py-3 bg-brand-primary text-white rounded-xl font-bold text-xs hover:bg-black transition-all shadow-lg shadow-brand-primary/10"
                  >
                    <Star className="w-4 h-4 fill-brand-accent text-brand-accent" />
                    Rate Your Experience
                  </button>
                )}
                {order.reviewed && (
                  <div className="flex items-center justify-center gap-2 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Review Submitted
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SELLER: Ship Order Panel ─────────────────────────────
function ShipOrderPanel({ orderId, onShipped }: { orderId: string; onShipped: () => void }) {
  const [trackingNumber, setTrackingNumber] = React.useState('');
  const [note, setNote] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleShip = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/ship`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber, shippingNote: note, deliveryMethod: 'shipping' })
      });
      if (res.ok) { onShipped(); setOpen(false); }
    } finally { setLoading(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
      <Truck className="w-4 h-4" /> Mark as Shipped
    </button>
  );

  return (
    <div className="flex flex-col gap-2 bg-blue-50 p-4 rounded-xl">
      <p className="text-xs font-bold text-blue-800">Enter shipping details:</p>
      <input className="text-sm border border-blue-200 rounded-lg px-3 py-2 outline-none bg-white" placeholder="Tracking Number (optional)" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />
      <input className="text-sm border border-blue-200 rounded-lg px-3 py-2 outline-none bg-white" placeholder="Note for buyer (e.g. via Delhivery)" value={note} onChange={e => setNote(e.target.value)} />
      <div className="flex gap-2">
        <button onClick={handleShip} disabled={loading} className="flex-1 text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
          {loading ? 'Sending...' : 'Confirm Shipment'}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-100">Cancel</button>
      </div>
    </div>
  );
}

// ─── BUYER: Confirm Delivery Button ────────────────────────
function ConfirmDeliveryButton({ orderId, onConfirmed }: { orderId: string; onConfirmed: () => void }) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    if (!window.confirm('Confirm you have received the item? This will release the payment to the seller.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-delivery`, { method: 'PATCH' });
      if (res.ok) { onConfirmed(); }
    } finally { setLoading(false); }
  };

  return (
    <button onClick={handleConfirm} disabled={loading} className="flex items-center gap-2 text-xs font-bold bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
      <PackageCheck className="w-4 h-4" />
      {loading ? 'Confirming...' : 'I Received It - Release Payment'}
    </button>
  );
}
