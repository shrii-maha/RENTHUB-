import { useState } from "react";
import { motion } from "motion/react";
import { Star, MapPin, Heart, ArrowUpRight, Filter, X } from "lucide-react";
import { Product } from "../types";

interface MarketplaceProps {
  listings: Product[];
  searchFilters?: { location: string; dates: string; category: string };
  onProductSelect: (product: Product) => void;
}

export default function Marketplace({ listings, searchFilters, onProductSelect }: MarketplaceProps) {
  const [activeType, setActiveType] = useState<'All' | 'Sale' | 'Rent'>('All');
  const [wishlist, setWishlist] = useState<string[]>([]);

  const toggleWishlist = (id: string) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filtered = listings.filter(item => {
    const isApproved = item.status === 'approved' || !item.status; // Support legacy items without status
    const matchesType = activeType === 'All' || item.type === activeType;
    const matchesLocation = !searchFilters?.location ||
      item.location.toLowerCase().includes(searchFilters.location.toLowerCase());
    const matchesCategory = !searchFilters?.category || searchFilters.category === 'All Categories' ||
      item.category.toLowerCase().includes(searchFilters.category.toLowerCase());
    return isApproved && matchesType && matchesLocation && matchesCategory;
  });

  return (
    <section className="py-32 px-6 md:px-12 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-primary/40 mb-4 block">Marketplace</span>
            <h2 className="text-5xl md:text-7xl font-display font-bold leading-tight">
              All <span className="italic text-brand-accent">Items</span>.
            </h2>
            {searchFilters?.location && (
              <p className="text-sm text-brand-primary/50 mt-2">
                Results near: <span className="font-bold text-brand-primary">{searchFilters.location}</span>
              </p>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 p-1 bg-brand-muted rounded-full">
            {(['All', 'Sale', 'Rent'] as const).map(type => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeType === type
                    ? 'bg-brand-primary text-white shadow-lg'
                    : 'text-brand-primary/60 hover:text-brand-primary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
            <X className="w-16 h-16 mb-4" />
            <p className="text-2xl font-display font-bold">No items found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group"
              >
                <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-6">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-[10px] font-mono uppercase tracking-widest">
                      {item.category}
                    </span>
                    <span className="px-3 py-1 bg-brand-accent rounded-full text-brand-primary text-[10px] font-bold uppercase tracking-widest">
                      {item.type}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleWishlist(item.id)}
                    className={`absolute top-6 right-6 p-3 backdrop-blur-md border rounded-full transition-all ${
                      wishlist.includes(item.id)
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-white/20 border-white/30 text-white hover:bg-white hover:text-brand-primary'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(item.id) ? 'fill-current' : ''}`} />
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                    <button 
                      onClick={() => onProductSelect(item)}
                      className="w-full py-4 bg-white text-brand-primary rounded-2xl font-bold flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                    >
                      <span>{item.type === 'Rent' ? 'Rent Now' : 'Buy Now'}</span>
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-start px-2">
                  <div>
                    <div className="flex items-center gap-2 text-brand-primary/40 text-[10px] font-mono uppercase tracking-widest mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{item.location}</span>
                    </div>
                    <h3 className="text-2xl font-display font-bold group-hover:text-brand-accent transition-colors">{item.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs font-bold mb-1">
                      <Star className="w-3 h-3 text-brand-accent fill-brand-accent" />
                      <span>{item.rating}</span>
                    </div>
                    <p className="text-xl font-display font-bold">{item.price}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
