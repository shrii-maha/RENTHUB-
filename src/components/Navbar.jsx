import { useState } from "react";
import { Menu, Shield, LayoutDashboard, X, LogOut, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar({ onOpenSell, onOpenAdmin, onNavigate, activeSection, onOpenDashboard, onCategorySelect, onOpenAuth }) {
  const { user, isSignedIn, isAdmin, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass h-20 flex items-center px-6 md:px-12 justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
        <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold text-xl">R</div>
        <span className="text-2xl font-display font-bold tracking-tighter hidden sm:block">RentHub</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest">
        <button 
          onClick={() => onNavigate('home')}
          className={`transition-colors ${activeSection === 'home' ? 'text-brand-accent' : 'text-brand-primary/60 hover:text-brand-primary'}`}
        >
          Home
        </button>
        <button 
          onClick={() => onNavigate('items')}
          className={`transition-colors ${activeSection === 'items' ? 'text-brand-accent' : 'text-brand-primary/60 hover:text-brand-primary'}`}
        >
          Marketplace
        </button>
        <button 
          onClick={() => onCategorySelect("Real Estate")}
          className="text-brand-primary/60 hover:text-brand-primary transition-colors"
        >
          Villas
        </button>
        <button 
          onClick={() => onCategorySelect("Vehicle")}
          className="text-brand-primary/60 hover:text-brand-primary transition-colors"
        >
          Vehicles
        </button>
      </div>

      <div className="flex items-center gap-4">
        {isSignedIn ? (
          <>
            {isAdmin ? (
              <button 
                onClick={onOpenAdmin}
                className="p-2 text-brand-primary/60 hover:text-brand-primary hover:bg-brand-muted rounded-full transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 px-4 shadow-sm"
                title="Admin Panel"
              >
                <Shield className="w-4 h-4" /> Admin Console
              </button>
            ) : (
              <>
                <button 
                  onClick={onOpenSell}
                  className="hidden sm:block px-6 py-2.5 bg-brand-accent text-brand-primary rounded-full text-sm font-bold hover:scale-105 transition-all shadow-lg shadow-brand-accent/20 border border-brand-accent hover:border-black"
                >
                  Sell Item
                </button>
                <div onClick={onOpenDashboard} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-black shadow-sm" title="My Hub">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
              </>
            )}

            {/* User Avatar + Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(prev => !prev)}
                className="w-9 h-9 rounded-full bg-brand-primary text-white font-bold text-sm flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                title={user?.fullName}
              >
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  : getInitials(user?.fullName)
                }
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-56 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 mb-2">
                    <p className="font-bold text-sm text-black truncate">{user?.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); onOpenDashboard(); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" /> My Dashboard
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAuth}
              className="hidden sm:block px-6 py-2.5 bg-brand-accent text-brand-primary rounded-full text-sm font-bold hover:scale-105 transition-all shadow-lg shadow-brand-accent/20 border border-brand-accent hover:border-black"
            >
              Sell Item
            </button>
            <button
              onClick={onOpenAuth}
              className="hidden sm:block px-6 py-2.5 bg-brand-primary text-white rounded-full text-sm font-bold hover:bg-brand-primary/90 transition-all"
            >
              Sign In
            </button>
          </div>
        )}

        <button className="p-2 md:hidden">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
