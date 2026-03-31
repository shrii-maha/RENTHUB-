import { Search, Menu, Shield, LayoutDashboard } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

interface NavbarProps {
  onOpenSell: () => void;
  onOpenAdmin: () => void;
  onNavigate: (section: 'home' | 'items' | 'insurance' | 'about' | 'contact' | 'privacy') => void;
  activeSection: 'home' | 'items' | 'insurance' | 'about' | 'contact' | 'privacy';
  onOpenDashboard: () => void;
}

export default function Navbar({ onOpenSell, onOpenAdmin, onNavigate, activeSection, onOpenDashboard }: NavbarProps) {
  const { user } = useUser();
  const isAdmin = user?.primaryEmailAddress?.emailAddress === import.meta.env.VITE_ADMIN_EMAIL;

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
        <a href="#" className="text-brand-primary/60 hover:text-brand-primary transition-colors">Villas</a>
        <a href="#" className="text-brand-primary/60 hover:text-brand-primary transition-colors">Vehicles</a>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-brand-muted rounded-full transition-colors">
          <Search className="w-5 h-5" />
        </button>


        <SignedIn>
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
          <UserButton />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="hidden sm:block px-6 py-2.5 bg-brand-primary text-white rounded-full text-sm font-bold hover:bg-brand-primary/90 transition-all">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>

        <button className="p-2 md:hidden">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
