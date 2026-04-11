import { Instagram, Twitter, Facebook, Youtube, Send } from "lucide-react";

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-white pt-24 pb-12 px-6 md:px-12 border-t border-brand-primary/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => onNavigate?.('home')}>
              <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold text-xl">R</div>
              <span className="text-2xl font-display font-bold tracking-tighter">RentHub</span>
            </div>
            <p className="text-brand-primary/60 leading-relaxed mb-8 text-sm">
              The world's most trusted platform for renting anything and listing everything. 
              Connecting people through shared resources since 2024.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-3 bg-brand-muted rounded-full hover:bg-brand-primary hover:text-white transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-3 bg-brand-muted rounded-full hover:bg-brand-primary hover:text-white transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-3 bg-brand-muted rounded-full hover:bg-brand-primary hover:text-white transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-3 bg-brand-muted rounded-full hover:bg-brand-primary hover:text-white transition-all">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-[0.3em] text-brand-primary/40 mb-8">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><button onClick={() => onNavigate?.('items')} className="hover:text-brand-accent transition-colors">Browse Listings</button></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">List an Item</a></li>
              <li><button onClick={() => onNavigate?.('how-it-works')} className="hover:text-brand-accent transition-colors">How it Works</button></li>
              <li><button onClick={() => onNavigate?.('insurance')} className="hover:text-brand-accent transition-colors text-left">Safety & Trust</button></li>
              <li><button onClick={() => onNavigate?.('delivery')} className="hover:text-brand-accent transition-colors text-left">Delivery Policy</button></li>
              <li><button onClick={() => onNavigate?.('insurance')} className="hover:text-brand-accent transition-colors text-left">Insurance Policy</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-[0.3em] text-brand-primary/40 mb-8">Company</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><button onClick={() => onNavigate?.('about')} className="hover:text-brand-accent transition-colors text-left">About Us</button></li>
              <li><button onClick={() => onNavigate?.('contact')} className="hover:text-brand-accent transition-colors text-left">Contact</button></li>
              <li><button onClick={() => onNavigate?.('privacy')} className="hover:text-brand-accent transition-colors text-left">Privacy Policy</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-[0.3em] text-brand-primary/40 mb-8">Newsletter</h4>
            <p className="text-brand-primary/60 text-sm mb-6 leading-relaxed">
              Subscribe to get the latest rental trends and exclusive offers.
            </p>
            <div className="relative">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-brand-muted border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-brand-accent transition-all"
              />
              <button className="absolute right-2 top-2 p-2 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition-all">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-brand-primary/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-mono text-brand-primary/40 uppercase tracking-widest">
            © 2026 RentHub Global Inc. All rights to RENTHUB.COM
          </p>
          <div className="flex gap-8 text-[10px] font-mono uppercase tracking-widest text-brand-primary/40">
            <a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Cookie Policy</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
