import React, { useState, useEffect } from "react";
import { X, Shield, LayoutDashboard, CheckSquare, Users, Wallet, AlertCircle, RefreshCw, BarChart2, ShieldCheck, PlaySquare, AlertOctagon, Landmark, Package, Search, Trash2, Edit3, ExternalLink, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "@clerk/clerk-react";
import EditListingModal from "./EditListingModal";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  listings: any[];
  onDelete: (id: string) => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'users' | 'payouts' | 'listings'>('overview');
  const [stats, setStats] = useState({ totalEarnings: 0, activeListings: 0, activeRents: 0, totalEscrowVolume: 0 });
  const [pending, setPending] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = userEmail === adminEmail;

  useEffect(() => {
    if (isAdmin && isOpen) {
      fetchAdminData();
      
      const interval = setInterval(fetchAdminData, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [isAdmin, isOpen]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, pendingRes, activityRes, usersRes, payoutsRes, listingsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/pending'),
        fetch('/api/admin/activity'),
        fetch('/api/admin/users'),
        fetch('/api/admin/payouts'),
        fetch('/api/admin/listings')
      ]);
      setStats(await statsRes.json());
      setPending(await pendingRes.json());
      setActivity(await activityRes.json());
      setUsersList(await usersRes.json());
      setPayouts(await payoutsRes.json());
      setAllListings(await listingsRes.json());
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/listings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setPending(prev => prev.filter(item => item._id !== id));
        fetchAdminData(); // Refresh stats and activity logs
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };
  const releasePayout = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/release`, {
        method: 'PATCH'
      });
      if (res.ok) {
        setPayouts(prev => prev.map(p => p._id === id ? { ...p, status: 'released' } : p));
        fetchAdminData();
      }
    } catch (err) {
      console.error("Failed to release payout", err);
    }
  };

  const disbursePayout = async (sellerId: string) => {
    try {
      const res = await fetch(`/api/admin/payouts/disburse/${sellerId}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        setPayouts(prev => prev.map(p => p.sellerId === sellerId && p.status === 'payout_requested' ? { ...p, status: 'paid' } : p));
        fetchAdminData();
      }
    } catch (err) {
      console.error("Failed to disburse payout", err);
    }
  };

  const releaseAllPayouts = async () => {
    try {
      const res = await fetch(`/api/admin/orders/release-all`, {
        method: 'POST'
      });
      if (res.ok) {
        setPayouts([]);
        fetchAdminData();
        alert("✅ All pending batches have been processed and released to bank.");
      }
    } catch (err) {
      console.error("Failed to release all payouts", err);
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to PERMANENTLY delete this listing? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAllListings(prev => prev.filter(l => l._id !== id));
        fetchAdminData();
      }
    } catch (err) {
      console.error("Failed to delete listing", err);
    }
  };

  const updateListing = async (id: string, updatedData: any) => {
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        setAllListings(prev => prev.map(l => l._id === id ? { ...l, ...updatedData } : l));
        fetchAdminData();
      }
    } catch (err) {
      console.error("Failed to update listing", err);
    }
  };

  // Helper for reliable image path resolution
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('uploads/')) return `/${url}`;
    return url;
  };

  const filteredListings = allListings.filter(l => 
    l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.sellerId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Main Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-[1400px] h-[95vh] md:h-[90vh] bg-[#f4f4f4] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-gray-200"
        >
          {/* Close Button Mobile/Global */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-8 p-3 bg-white/50 backdrop-blur-md hover:bg-white border border-gray-200 rounded-2xl z-20 transition-all shadow-sm"
          >
            <X className="w-5 h-5 text-black" />
          </button>

          {!isAdmin ? (
            // ACCESS DENIED VIEW
            <div className="flex-1 flex flex-col items-center justify-center bg-white p-12 text-center text-black">
              <div className="w-24 h-24 bg-red-50 border-8 border-red-500/10 rounded-full flex items-center justify-center mb-8">
                <Shield className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-4xl font-display font-bold tracking-tight mb-4">RESTRICTED ZONE.</h1>
              <p className="text-gray-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed text-sm">
                This terminal is classified. The credentials associated with <span className="font-bold text-black border-b border-black">{userEmail || 'Guest'}</span> do not have clearance level 5 to access the main grid grid infrastructure.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 w-full max-w-md text-left">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block mb-2">Required Credentials</label>
                <code className="text-sm font-bold text-black bg-white p-3 rounded-xl block border border-gray-200 shadow-sm cursor-text selection:bg-brand-accent">
                  {adminEmail}
                </code>
              </div>

              <button 
                onClick={onClose}
                className="mt-10 px-8 py-4 bg-black text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-black/10"
              >
                Return to Safe Zone
              </button>
            </div>
          ) : (
            // ADMIN DASHBOARD
            <>
              {/* SIDEBAR */}
              <div className="w-full md:w-[280px] bg-black p-10 md:px-6 md:py-10 flex flex-col h-full flex-shrink-0">
                <div className="flex items-center gap-3 mb-16 pl-2">
                  <div className="bg-brand-accent w-9 h-9 rounded-[10px] flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Shield className="w-5 h-5 text-black" />
                  </div>
                  <span className="text-white font-extrabold text-lg tracking-tight">Admin Console</span>
                </div>

                <nav className="flex flex-col gap-1.5 flex-1">
                  <SidebarItem 
                    icon={<LayoutDashboard />} 
                    label="Overview" 
                    active={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')} 
                  />
                  <SidebarItem 
                    icon={<CheckSquare />} 
                    label="Approvals" 
                    badge={pending.length > 0 ? pending.length.toString() : undefined}
                    active={activeTab === 'approvals'}
                    onClick={() => setActiveTab('approvals')} 
                  />
                  <SidebarItem 
                    icon={<Users />} 
                    label="Users" 
                    active={activeTab === 'users'}
                    onClick={() => setActiveTab('users')} 
                  />
                  <SidebarItem 
                    icon={<Wallet />} 
                    label="Payouts" 
                    active={activeTab === 'payouts'}
                    onClick={() => setActiveTab('payouts')} 
                  />
                  <SidebarItem 
                    icon={<Package />} 
                    label="Products" 
                    badge={allListings.length.toString()}
                    active={activeTab === 'listings'}
                    onClick={() => setActiveTab('listings')} 
                  />
                </nav>

                <div className="bg-[#111] p-5 rounded-[20px] border border-[#222]">
                  <div className="text-[10px] text-white/40 uppercase font-extrabold tracking-widest mb-3">Server Status</div>
                  <div className="flex items-center gap-2 text-green-500 text-xs font-bold">
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#10B981] animate-pulse"></div>
                    Operational
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="flex-1 p-8 md:p-12 lg:p-[50px] bg-white md:rounded-l-[40px] overflow-y-auto min-h-0 shadow-[-20px_0_40px_rgba(0,0,0,0.05)] border-l border-gray-100">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <>
                    {/* TOP HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 mr-12 md:mr-0">
                      <h1 className="text-3xl lg:text-[32px] font-extrabold text-black tracking-tight mb-4 md:mb-0">
                        Dashboard Overview
                      </h1>
                      <button className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-black rounded-xl font-bold text-sm transition-colors cursor-pointer">
                        Last 30 Days
                      </button>
                    </div>

                {/* KPI STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-gray-50/50 p-6 lg:p-6 rounded-3xl border border-gray-100">
                    <div className="text-[11px] text-gray-400 font-extrabold uppercase tracking-widest">Platform Earnings</div>
                    <div className="text-3xl font-extrabold mt-3 tracking-tighter">₹{stats.totalEarnings.toLocaleString()}</div>
                    <div className="text-green-500 text-xs font-bold mt-2">↑ Dynamic Feed</div>
                  </div>
                  <div className="bg-gray-50/50 p-6 lg:p-6 rounded-3xl border border-gray-100">
                    <div className="text-[11px] text-gray-400 font-extrabold uppercase tracking-widest">Total Active Listings</div>
                    <div className="text-3xl font-extrabold mt-3 tracking-tighter">{stats.activeListings}</div>
                    <div className="text-blue-500 text-xs font-bold mt-2">Live on site</div>
                  </div>
                  <div className="bg-gray-50/50 p-6 lg:p-6 rounded-3xl border border-gray-100">
                    <div className="text-[11px] text-gray-400 font-extrabold uppercase tracking-widest">Active Rents</div>
                    <div className="text-3xl font-extrabold mt-3 tracking-tighter">{stats.activeRents}</div>
                    <div className="text-brand-accent text-xs font-bold mt-2">In Progress</div>
                  </div>
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-8">
                  
                  {/* APPROVAL QUEUE */}
                  <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="m-0 text-xl font-extrabold tracking-tight">Pending Approvals ({pending.length})</h3>
                      <span className="text-xs text-blue-500 font-bold cursor-pointer hover:underline">View All</span>
                    </div>

                    <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
                      {isLoading ? (
                         <div className="text-sm text-gray-400 mx-auto py-10 font-bold animate-pulse">Scanning database...</div>
                      ) : pending.length === 0 ? (
                         <div className="text-sm text-gray-400 mx-auto py-10 font-bold italic">Queue is clear.</div>
                      ) : pending.map((item, index) => (
                        <React.Fragment key={item._id}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="flex gap-4 items-center">
                              <div className="w-14 h-14 bg-gray-100 rounded-[14px] flex items-center justify-center shrink-0 overflow-hidden">
                                <img src={getImageUrl(item.image)} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="font-bold text-[15px] mb-0.5">{item.title}</div>
                                <div className="text-xs text-gray-400 font-medium tracking-wide">{item.price} • {item.category}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => updateStatus(item._id, 'approved')} className="px-5 py-2.5 bg-black text-white hover:bg-gray-800 border-none rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-sm">Approve</button>
                              <button onClick={() => updateStatus(item._id, 'rejected')} className="px-5 py-2.5 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-sm">Reject</button>
                            </div>
                          </div>
                          {index < pending.length - 1 && <div className="h-px w-full bg-gray-50 my-2" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* SYSTEM LOGS */}
                  <div className="bg-[#050505] border border-[#1a1a1a] rounded-[2rem] p-8 text-white shadow-xl shadow-black/10 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                    
                    <h3 className="m-0 mb-8 text-xl font-extrabold tracking-tight relative z-10 flex items-center justify-between">
                      Recent Activity
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    </h3>
                    
                    <div className="flex flex-col gap-6 relative z-10 max-h-[300px] overflow-y-auto">
                      {activity.length === 0 ? (
                        <div className="text-sm text-gray-500 font-bold italic">No recent network activity.</div>
                      ) : activity.map((log) => (
                        <div key={log._id} className="flex gap-4 group">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            log.actionType === 'payout' ? 'bg-brand-accent shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                            log.actionType === 'rental' ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                            log.actionType === 'report' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                            'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                          }`} />
                          <div>
                            <div className={`text-[13px] font-bold text-white mb-1 transition-colors ${
                              log.actionType === 'payout' ? 'group-hover:text-brand-accent' :
                              log.actionType === 'rental' ? 'group-hover:text-green-400' :
                              log.actionType === 'report' ? 'group-hover:text-red-400' :
                              'group-hover:text-blue-400'
                            }`}>{log.message}</div>
                            <div className="text-[11px] text-gray-400 tracking-wide font-medium">{log.details} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="mt-auto pt-8 w-full">
                       <div className="w-full py-3.5 bg-[#141414] hover:bg-[#202020] text-gray-300 rounded-xl text-[12px] font-bold cursor-pointer transition-colors border border-white/5 shadow-inner">
                         View Audit Logs
                       </div>
                    </button>
                  </div>

                </div>
                  </>
                )}

                {/* APPROVALS TAB */}
                {activeTab === 'approvals' && (
                  <div className="flex flex-col h-full mr-12 md:mr-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                      <h2 className="text-3xl lg:text-[32px] font-extrabold text-black tracking-tight mb-4 md:mb-0">Moderation Queue ({pending.length})</h2>
                      <div className="flex gap-2 w-full md:w-auto">
                        <input type="text" placeholder="Search listings..." className="w-full md:w-64 px-5 py-3 rounded-xl border border-gray-100 outline-none bg-gray-50 text-sm font-medium focus:border-black transition-colors" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {isLoading ? (
                         <div className="text-sm text-gray-400 mx-auto py-10 font-bold animate-pulse">Scanning database...</div>
                      ) : pending.length === 0 ? (
                         <div className="text-sm text-gray-400 mx-auto py-10 font-bold italic">Moderation queue is empty and secure.</div>
                      ) : pending.map((item) => (
                        <div key={item._id} className="bg-white border border-gray-100 rounded-[24px] p-6 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-28 h-28 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                            <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <div className="flex gap-2 mb-2">
                              <span className="text-[10px] font-extrabold text-brand-accent bg-orange-50 px-3 py-1 rounded-full uppercase tracking-widest">{item.category}</span>
                              <span className="text-[10px] font-extrabold text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">{item.type}</span>
                            </div>
                            <h3 className="m-0 text-[20px] font-bold text-black mb-1">{item.title}</h3>
                            <p className="text-[13px] text-gray-400 font-medium tracking-wide mb-3">Owner: {item.sellerId} • Posted: {new Date(item.createdAt).toLocaleDateString()}</p>
                            <div className="font-extrabold text-xl text-black">{item.price} <span className="font-medium text-xs text-gray-400">/ {item.type === 'Rent' ? 'day' : 'total'}</span></div>
                          </div>
                          <div className="flex flex-col gap-3 w-full md:w-[200px] shrink-0">
                            <button onClick={() => updateStatus(item._id, 'approved')} className="w-full py-3.5 bg-black text-white border-none rounded-xl font-bold text-sm cursor-pointer hover:bg-gray-800 transition-all shadow-md active:scale-95">Approve Listing</button>
                            <button onClick={() => updateStatus(item._id, 'rejected')} className="w-full py-3.5 bg-white border border-red-500/50 text-red-500 rounded-xl font-bold text-sm cursor-pointer hover:bg-red-50 transition-all shadow-sm active:scale-95">Reject / Spam</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* USERS DIRECTORY TAB */}
                {activeTab === 'users' && (
                  <div className="flex flex-col h-full mr-12 md:mr-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-10 flex-col md:flex-row">
                      <h2 className="text-3xl lg:text-[32px] font-extrabold text-black tracking-tight mb-4 md:mb-0">User Directory</h2>
                      <div className="flex gap-2 w-full md:w-auto">
                        <input type="text" placeholder="Search sellers..." className="w-full md:w-64 px-5 py-3 rounded-xl border border-gray-100 outline-none bg-gray-50 text-sm font-medium focus:border-black transition-colors" />
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-sm">
                      <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full border-collapse text-left whitespace-nowrap min-w-[700px]">
                          <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                              <th className="p-6 text-xs font-extrabold text-gray-400 uppercase tracking-widest">User</th>
                              <th className="p-6 text-xs font-extrabold text-gray-400 uppercase tracking-widest">Platform Activity</th>
                              <th className="p-6 text-xs font-extrabold text-gray-400 uppercase tracking-widest">Average Rating</th>
                              <th className="p-6 text-xs font-extrabold text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                               <tr><td colSpan={4} className="p-10 text-center text-sm font-bold text-gray-400 animate-pulse">Syncing user database...</td></tr>
                            ) : usersList.length === 0 ? (
                               <tr><td colSpan={4} className="p-10 text-center text-sm font-bold text-gray-400 italic">No active sellers found.</td></tr>
                            ) : usersList.map((usr: any, index: number) => {
                               const isActive = usr.lastActive && new Date().getTime() - new Date(usr.lastActive).getTime() < 15 * 60 * 1000;
                               const displayName = usr.fullName || usr.email.split('@')[0];
                               
                               return (
                               <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                  <td className="p-6">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 bg-black text-white rounded-[16px] flex items-center justify-center font-bold text-xl shadow-sm border border-gray-800">
                                             {displayName.charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                              <div className="font-extrabold text-black text-[15px]">{displayName}</div>
                                              <div className="text-xs font-medium text-gray-400 mt-0.5 tracking-wide">{usr.email}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-6">
                                      <div className="text-[14px] font-extrabold text-black mb-1">{usr.totalListings} Listings Posted</div>
                                      {isActive ? (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-green-500 tracking-wide mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#10B981]"></div> Active on Website
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 tracking-wide mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> Offline {usr.lastActive && `(Seen ${Math.floor((new Date().getTime() - new Date(usr.lastActive).getTime()) / 60000)}m ago)`}
                                        </div>
                                      )}
                                  </td>
                                  <td className="p-6 font-extrabold text-brand-accent text-lg drop-shadow-sm">
                                      ⭐ {usr.avgRating ? usr.avgRating.toFixed(1) : "5.0"}
                                  </td>
                                  <td className="p-6 text-right">
                                      <button className="px-5 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 rounded-xl font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95 text-center inline-block">Suspend</button>
                                  </td>
                               </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAYOUTS & ESCROW TAB */}
                {activeTab === 'payouts' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mr-12 md:mr-0">
                    {/* PAYOUTS HEADER CARD */}
                    <div className="bg-black text-white p-10 rounded-[2.5rem] mb-10 flex flex-col md:flex-row justify-between items-center shadow-2xl shadow-black/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-accent/20 transition-all duration-700" />
                      <div className="relative z-10">
                        <div className="text-[12px] text-white/40 font-extrabold uppercase tracking-[0.3em] mb-4">Total Escrow Volume</div>
                        <div className="text-5xl font-extrabold tracking-tighter italic">₹{stats.totalEscrowVolume.toLocaleString()}</div>
                        <div className="flex items-center gap-2 mt-4 text-brand-accent/60 text-xs font-bold uppercase tracking-widest">
                          <ShieldCheck className="w-4 h-4" />
                          Secured by RentHub Protocol
                        </div>
                      </div>
                      <button 
                        onClick={releaseAllPayouts}
                        disabled={payouts.filter(p => ['escrow', 'shipped'].includes(p.status)).length === 0}
                        className="mt-8 md:mt-0 px-10 py-5 bg-brand-accent text-black rounded-2xl font-extrabold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-accent/20 relative z-10 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                      >
                        Release All Escrow
                      </button>
                    </div>

                    {/* NEW SECTION: WITHDRAWAL REQUESTS */}
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-amber-600" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-black tracking-tight">Withdrawal Requests</h3>
                        </div>

                        {payouts.filter(p => p.status === 'payout_requested').length === 0 ? (
                           <div className="bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[2.5rem] p-12 text-center">
                               <p className="text-sm font-bold text-gray-400 italic">No active withdrawal requests from sellers.</p>
                           </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5">
                                {Object.entries(
                                    payouts.filter(p => p.status === 'payout_requested').reduce((acc: any, order) => {
                                        if (!acc[order.sellerId]) acc[order.sellerId] = { orders: [], total: 0 };
                                        const basePrice = parseInt(order.listingId?.price?.replace(/[^\d]/g, '')) || 0;
                                        const netPayout = order.listingId?.type === 'Sale' ? basePrice * 0.95 : basePrice * 0.85;
                                        acc[order.sellerId].orders.push(order);
                                        acc[order.sellerId].total += netPayout;
                                        return acc;
                                    }, {})
                                ).map(([sellerId, data]: [string, any]) => (
                                    <div key={sellerId} className="bg-white border-2 border-black rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-black text-white rounded-3xl flex items-center justify-center font-bold text-xl uppercase italic shadow-lg shrink-0">
                                                {sellerId.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono font-extrabold text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full">Request Pending</span>
                                                    <span className="text-gray-400 font-mono text-[10px] uppercase font-bold">• {data.orders.length} items grouped</span>
                                                </div>
                                                <h4 className="text-xl font-bold text-black truncate max-w-xs">{sellerId}</h4>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            <div className="text-right">
                                                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Total to Disburse</span>
                                                <div className="text-3xl font-display font-black text-black">₹{Math.floor(data.total).toLocaleString()}</div>
                                            </div>
                                            <button 
                                                onClick={() => disbursePayout(sellerId)}
                                                className="px-10 py-5 bg-green-600 text-white hover:bg-green-700 rounded-2xl font-extrabold text-sm transition-all shadow-xl shadow-green-600/20 active:scale-95 flex items-center gap-3 border-none cursor-pointer"
                                            >
                                                <CheckCircle className="w-5 h-5" /> Process Disburse
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <h3 className="text-2xl font-extrabold text-black tracking-tight mb-8">Held in Escrow (Unreleased)</h3>
                    
                    <div className="flex flex-col gap-4 mb-16">
                      {isLoading ? (
                        <div className="text-sm text-gray-400 mx-auto py-10 font-bold animate-pulse">Scanning ledger...</div>
                      ) : payouts.filter(p => ['escrow', 'shipped'].includes(p.status)).length === 0 ? (
                        <div className="bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[2rem] p-16 text-center">
                          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                            <Wallet className="w-10 h-10 text-gray-200" />
                          </div>
                          <h4 className="text-lg font-bold text-gray-400">Escrow is currently empty.</h4>
                          <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">Awaiting new marketplace transactions</p>
                        </div>
                      ) : payouts.filter(p => ['escrow', 'shipped'].includes(p.status)).map((payout) => (
                        <div key={payout._id} className="bg-white border border-gray-100 rounded-[2rem] p-6 pr-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all group">
                          <div className="flex items-center gap-6 w-full md:w-auto">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 group-hover:rotate-2 transition-transform">
                              {payout.listingId?.image ? (
                                <img src={getImageUrl(payout.listingId.image)} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <Landmark className="w-8 h-8 text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-extrabold text-lg text-black mb-1">{payout.buyerId.split('@')[0]}</div>
                              <div className="text-xs text-gray-400 font-medium tracking-wide">
                                Reference: <span className="font-bold text-gray-600">RT-{payout._id.slice(-6).toUpperCase()}</span> • {payout.listingId?.title || "Unknown Asset"}
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest ${
                                  payout.paymentMethod === 'upi' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'
                                }`}>
                                  {payout.paymentMethod} Payment
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col md:flex-row items-center gap-10 w-full md:w-auto">
                            <div className="text-right">
                              <div className="text-2xl font-extrabold text-black">₹{payout.amount.toLocaleString()}</div>
                              <div className="text-[10px] text-green-500 font-extrabold uppercase tracking-widest flex items-center justify-end gap-1.5 mt-1">
                                <div className="w-1 h-1 bg-green-500 rounded-full" />
                                Released by Renter
                              </div>
                            </div>
                            <button 
                              onClick={() => releasePayout(payout._id)}
                              className="w-full md:w-auto px-8 py-4 bg-black text-white hover:bg-gray-800 rounded-2xl font-extrabold text-xs transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                              Release to Bank
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-2xl font-extrabold text-black tracking-tight mb-8 border-t border-gray-100 pt-10">Platform Profit Ledger</h3>
                    
                    <div className="flex flex-col gap-4">
                       {payouts.length === 0 ? (
                          <div className="text-sm text-gray-400 mx-auto py-10 font-bold italic">No platform profits recorded yet.</div>
                       ) : payouts.map((order) => {
                          const basePrice = parseInt(order.listingId?.price?.replace(/[^\d]/g, '')) || 0;
                          const commPercent = order.listingId?.type === 'Sale' ? 0.05 : 0.15;
                          const adminCommission = basePrice * commPercent;
                          const serviceFee = basePrice * 0.05; // Buyer's 5% service fee
                          const totalProfit = adminCommission + serviceFee;
                          
                          return (
                            <div key={`profit-${order._id}`} className="bg-[#0f0f0f] text-white p-5 rounded-[16px] font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#222]">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#222] rounded-[10px] flex items-center justify-center shrink-0 border border-white/5">
                                        <Wallet className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold tracking-wide">#RH-{order._id.slice(-6).toUpperCase()}</div>
                                        <div className="text-[11px] text-gray-400 mt-0.5 font-medium tracking-wide">
                                            Buyer: <span className="text-gray-300">{order.buyerId.split('@')[0]}</span> <span className="mx-1 text-gray-600">→</span> Seller: <span className="text-gray-300">{order.sellerId.split('@')[0]}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="sm:text-right border-t sm:border-none border-white/10 pt-4 sm:pt-0">
                                    <div className="text-[10px] text-brand-accent font-extrabold uppercase tracking-widest drop-shadow-sm mb-1">Admin Profit</div>
                                    <div className="text-xl font-black text-green-400 drop-shadow-sm">+ ₹{Math.floor(totalProfit).toLocaleString()}</div>
                                    <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">(Comm + Service Fee)</div>
                                </div>
                            </div>
                          );
                       })}
                    </div>
                  </div>
                )}

                {/* PRODUCT MANAGEMENT TAB */}
                {activeTab === 'listings' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mr-12 md:mr-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                      <div>
                        <h2 className="text-3xl lg:text-[32px] font-extrabold text-black tracking-tight mb-2">Manage Listings</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{allListings.length} Total Inventory Units</p>
                      </div>
                      <div className="relative mt-4 md:mt-0 w-full md:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Find by title, ID or seller..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-80 pl-11 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:border-black outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left whitespace-nowrap">
                          <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-8 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Asset</th>
                                <th className="p-8 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Owner / ID</th>
                                <th className="p-8 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="p-8 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Price Point</th>
                                <th className="p-8 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-20 text-center text-sm font-bold text-gray-400 animate-pulse uppercase tracking-[0.2em]">Accessing Central Grid Database...</td></tr>
                            ) : filteredListings.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-sm font-bold text-gray-400 italic">No assets found matching the query.</td></tr>
                            ) : filteredListings.map((listing) => (
                                <tr key={listing._id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="p-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0 border border-gray-200 group-hover:scale-105 transition-transform duration-500">
                                                <img src={getImageUrl(listing.image)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-black text-base group-hover:text-brand-accent transition-colors">{listing.title}</div>
                                                <div className="text-[10px] text-gray-400 font-extrabold mt-1 tracking-[0.1em] uppercase">{listing.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <div className="font-bold text-gray-600 text-[13px]">{listing.sellerId?.split('@')[0] || "System"}</div>
                                        <div className="text-[9px] text-gray-400 mt-0.5 font-mono">#{listing._id.slice(-8).toUpperCase()}</div>
                                    </td>
                                    <td className="p-8">
                                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${
                                            listing.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            listing.status === 'pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                            listing.status === 'sold' || listing.status === 'rented' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {listing.status || 'Draft'}
                                        </span>
                                    </td>
                                    <td className="p-8">
                                        <div className="font-black text-black tracking-tight text-lg">{listing.price}</div>
                                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{listing.type} Mode</div>
                                    </td>
                                    <td className="p-8 text-right">
                                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                                            <button 
                                                onClick={() => setEditingListing(listing)}
                                                className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-black hover:border-black rounded-xl cursor-pointer transition-all shadow-sm active:scale-95"
                                                title="Edit Metadata"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => deleteListing(listing._id)}
                                                className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-500 rounded-xl cursor-pointer transition-all shadow-sm active:scale-95"
                                                title="Permanent Removal"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
        
        {/* EDIT MODAL */}
        <EditListingModal 
            isOpen={!!editingListing} 
            onClose={() => setEditingListing(null)}
            listing={editingListing}
            onUpdate={updateListing}
        />
      </div>
    </AnimatePresence>
  );
}

function SidebarItem({ icon, label, badge, active, onClick }: { icon: React.ReactElement, label: string, badge?: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-3.5 rounded-[16px] font-bold cursor-pointer transition-all ${
        active 
          ? 'bg-brand-accent text-black' 
          : 'text-gray-400 hover:text-white hover:bg-[#111]'
      }`}
    >
      {React.cloneElement(icon, { 
        className: "w-[18px] h-[18px]", 
        strokeWidth: 2.5 
      } as any)}
      <span className="text-[14px]">{label}</span>
      {badge && (
        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-[10px] font-extrabold shadow-sm ${
          active ? 'bg-black text-white' : 'bg-red-500 text-white'
        }`}>
          {badge}
        </span>
      )}
    </div>
  );
}
