import React, { useState, useEffect } from "react";
import { X, LayoutDashboard, ShoppingBag, Wallet, LogOut, Plus, ChevronRight, CheckCircle2, Clock, Landmark, ArrowUpRight, ShieldCheck, MoreHorizontal, Camera, Box } from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import ReceiptModal from "./ReceiptModal";

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

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = userEmail === import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    if (isOpen && userEmail && !isAdmin) {
      // Fetch Seller Payouts/Orders
      fetch(`/api/orders/seller/${userEmail}`)
        .then(res => res.json())
        .then(data => setOrders(Array.isArray(data) ? data : []))
        .catch(console.error);

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

  orders.forEach(order => {
    const listing = order.listingId;
    if (!listing) return;
    const basePrice = parseInt(listing.price.replace(/[^\d]/g, '')) || 0;
    const netPayout = listing.type === 'Sale' ? basePrice * 0.95 : basePrice * 0.85;
    
    if (order.status === 'escrow') {
      pendingEarnings += netPayout;
    } else if (order.status === 'released') {
      availableBalance += netPayout;
    }
  });

  const rawEarnings = availableBalance + pendingEarnings;
  const totalPaidOut = availableBalance;

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
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-10 h-10 bg-brand-accent rounded-2xl flex items-center justify-center shadow-lg shadow-brand-accent/20">
                     <div className="w-2 h-2 bg-black rounded-full" />
                  </div>
                  <span className="text-white font-display font-bold text-2xl tracking-tighter">My Hub.</span>
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
                  <h1 className="text-3xl md:text-4xl font-display font-bold leading-none mb-4 italic tracking-tight">
                    {activeTab === 'dashboard' ? 'Welcome back,' : activeTab === 'earnings' ? 'My Earnings.' : activeTab === 'purchases' ? 'My Purchases.' : 'My Listings.'} <br />
                    <span className="text-brand-accent underline decoration-brand-accent/30 underline-offset-8">
                      {activeTab === 'dashboard' ? (user.firstName || 'Member') : ''}
                    </span>
                  </h1>
                  <p className="text-brand-primary/40 text-xs font-medium tracking-wide">
                    {activeTab === 'dashboard' ? 'Track your performance and manage item listings.' : activeTab === 'earnings' ? 'Manage your payouts and transparent history.' : activeTab === 'purchases' ? 'Track your active rentals and secured buys.' : 'Organize and promote your assets.'}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={onOpenSell} className="px-6 py-3.5 bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-black/10 hover:scale-105 transition-all flex items-center gap-3">
                    <Plus className="w-5 h-5" /> New Listing
                  </button>
                  <button onClick={onClose} className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                    <X className="w-6 h-6" />
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
                      <EarningsSummary balance={availableBalance} pending={pendingEarnings} totalPaid={totalPaidOut} />
                      <TransactionHistory orders={orders} />
                    </motion.div>
                  )}

                  {activeTab === 'listings' && (
                    <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <ListingsGrid listings={userListings} showFilters={true} />
                    </motion.div>
                  )}

                  {activeTab === 'purchases' && (
                    <motion.div key="purchases" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <PurchasesGrid orders={buyerOrders} onViewSource={(order: any) => setReceiptData({ product: order.listingId, orderId: order._id })} />
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
      <StatCard label="Total Earnings" value={`₹${earnings.toLocaleString()}`} sub="+ ₹2,100 this week" subColor="text-green-500" />
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

function EarningsSummary({ balance, pending, totalPaid }: { balance: number, pending: number, totalPaid: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
      <div className="md:col-span-1.5 bg-brand-primary text-white p-8 rounded-[2.5rem] shadow-2xl shadow-brand-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Available Balance</span>
        <div className="text-4xl font-display font-bold mt-4 tracking-tighter italic">₹{balance.toLocaleString()}.00</div>
        <div className="mt-6 flex items-center gap-2 text-brand-accent text-[10px] font-bold uppercase tracking-widest">
           <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
           Ready for payout
        </div>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-primary/30">Pending</span>
        <div className="text-2xl font-display font-bold mt-3 text-brand-primary/60 tracking-tight">₹{pending.toLocaleString()}</div>
        <div className="mt-3 text-[9px] font-bold text-brand-accent uppercase tracking-widest italic">Active Rentals</div>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-primary/30">Total Withdrawn</span>
        <div className="text-2xl font-display font-bold mt-3 tracking-tight">₹{totalPaid.toLocaleString()}</div>
        <div className="mt-3 text-[9px] font-bold text-brand-primary/20 uppercase tracking-widest">Last 12 Months</div>
      </div>
    </div>
  );
}

function TransactionHistory({ orders }: { orders: any[] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <Wallet className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold italic text-black mb-1">No transactions yet.</h3>
        <p className="text-gray-400 text-sm">When someone buys or rents your items, your earnings will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
      {orders.map((order) => {
        const listing = order.listingId;
        const title = listing?.title || "Unknown Asset";
        const type = listing?.type || "Sale";
        const basePrice = parseInt(listing?.price?.replace(/[^\d]/g, '')) || 0;
        const feePercent = type === 'Sale' ? 5 : 15;
        const platformFee = Math.floor(basePrice * (feePercent / 100));
        const netPayout = basePrice - platformFee;
        const isEscrow = order.status === 'escrow';

        return (
          <div key={order._id} className="bg-white p-6 rounded-[20px] border border-gray-100 font-sans shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-5">
                  <div>
                    <h4 className="m-0 text-base font-bold text-black leading-tight">{title}</h4>
                    <div className="text-[10px] text-gray-400 mt-1 font-medium tracking-wide">Ref: #{order._id.slice(-6).toUpperCase()}</div>
                  </div>
                  {isEscrow ? (
                    <span className="bg-orange-50 text-orange-600 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0">PENDING ESCROW</span>
                  ) : (
                    <span className="bg-green-50 text-green-600 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0">RELEASED</span>
                  )}
              </div>

              <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium tracking-wide">Gross {type === 'Rent' ? 'Rental' : 'Sale'} Fee</span>
                      <span className="font-bold text-black">₹{basePrice.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between items-center text-red-500">
                      <span className="font-medium tracking-wide">RentHub Platform Fee ({feePercent}%)</span>
                      <span className="font-bold">- ₹{platformFee.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 font-extrabold text-lg text-black mt-1">
                      <span>Your Payout</span>
                      <span>₹{netPayout.toLocaleString()}.00</span>
                  </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-4 font-medium">
                {isEscrow ? "Funds will be released to your bank 24h after the exchange completes." : "Funds have been successfully transmitted to your connected bank."}
              </p>
          </div>
        );
      })}
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

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.length === 0 ? (
           <div className="col-span-full py-16 text-center text-gray-400 italic font-medium bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
             No items found matching your filter.
           </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-[1.5rem] p-5 flex items-center gap-5 group hover:shadow-xl transition-all shadow-sm">
              <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative">
                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                <div className="absolute inset-0 bg-black/5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1.5">
                   <span className={`px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                     item.status === 'sold' ? 'bg-red-50 text-red-700' :
                     item.status === 'rented' ? 'bg-blue-50 text-blue-700' :
                     item.status === 'approved' ? 'bg-green-50 text-green-700' :
                     'bg-gray-100 text-gray-500'
                   }`}>
                     {item.status === 'sold' ? 'Sold Out' : 
                      item.status === 'rented' ? 'Currently Rented' : 
                      item.status === 'approved' ? 'Active' : 
                      item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Pending'}
                   </span>
                   <button className="text-gray-300 hover:text-black transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                <h4 className="text-base font-bold text-brand-primary truncate group-hover:text-brand-accent transition-colors mb-0.5">{item.title}</h4>
                <div className="text-[10px] text-brand-primary/40 font-bold mb-3">
                  {item.type === 'Rent' ? 'Earned: ' : 'Price: '} 
                  <span className="text-brand-primary">
                    {item.type === 'Rent' ? `₹${(parseInt(item.price.replace(/[^\d]/g, '')) / 5).toLocaleString()}` : item.price}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-3 border border-gray-100 rounded-lg text-[9px] font-bold hover:bg-gray-50 transition-colors uppercase tracking-widest">
                    {item.type === 'Rent' ? 'Manage' : 'Edit'}
                  </button>
                  <button className={`flex-1 py-2 px-3 rounded-lg text-[9px] font-bold transition-all uppercase tracking-widest ${
                    item.type === 'Rent' ? 'bg-brand-accent text-brand-primary hover:shadow-lg shadow-brand-accent/20' : 'bg-black text-white hover:bg-gray-800'
                  }`}>
                    {item.type === 'Rent' ? 'Boost' : 'Promote'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PurchasesGrid({ orders, onViewSource }: { orders: any[], onViewSource: (order: any) => void }) {
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
        const isEscrow = order.status === 'escrow';

        return (
          <div key={order._id} className="bg-white p-5 rounded-[20px] border border-gray-100 font-sans shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
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
                    {isEscrow ? (
                      <span className="bg-orange-50 text-orange-600 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">Processing</span>
                    ) : (
                      <span className="bg-green-50 text-green-600 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">Secured</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium tracking-wide mb-3">Ref: #{order._id.slice(-6).toUpperCase()} • {type}</div>
                  
                  <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-0.5">Total Paid</span>
                        <span className="font-bold text-black">₹{order.amount.toLocaleString()}.00</span>
                      </div>
                      <button 
                        onClick={() => onViewSource(order)}
                        className="text-[10px] font-bold bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                         <CheckCircle2 className="w-3 h-3" /> View Source
                      </button>
                  </div>
              </div>
          </div>
        );
      })}
    </div>
  );
}
