import { useState } from "react";
import { motion } from "motion/react";
import { Star, MapPin, Heart, ArrowUpRight, X, ShieldCheck, MessageSquare } from "lucide-react";

// Sub-component for individual listing to handle "Honest Trust" data fetching
function MarketplaceItem({ 
  item, 
  index, 
  onProductSelect, 
  isWishlisted, 
  onToggleWishlist,
  onOpenChat
}) {
  const sellerProfile = item.sellerStats;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group"
    >
      <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-6">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-[10px] font-mono uppercase tracking-widest">
              {item.category}
            </span>
            <span className="px-3 py-1 bg-brand-accent rounded-full text-brand-primary text-[10px] font-bold uppercase tracking-widest">
              {item.type}
            </span>
          </div>
          {/* Seller Trust Badge on Image */}
          {sellerProfile?.isVerified && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/90 text-white rounded-full text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm self-start">
              <ShieldCheck className="w-3 h-3" />
              Verified Seller
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(item.id);
          }}
          className={`absolute top-6 right-6 p-3 backdrop-blur-md border rounded-full transition-all ${
            isWishlisted
              ? 'bg-red-500 border-red-500 text-white'
              : 'bg-white/20 border-white/30 text-white hover:bg-white hover:text-brand-primary'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
          <div className="w-full flex flex-col gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <button 
              onClick={() => onProductSelect(item)}
              className="w-full py-4 bg-white text-brand-primary rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <span>{item.type === 'Rent' ? 'Rent Now' : 'Buy Now'}</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onOpenChat(item.sellerId, item.id)}
              className="w-full py-3 bg-brand-accent/90 backdrop-blur-md text-brand-primary rounded-xl font-bold flex items-center justify-center gap-2 text-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat with Seller</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-2">
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-brand-primary/40 text-[10px] font-mono uppercase tracking-widest mb-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{item.location}</span>
            </div>
            <h3 className="text-2xl font-display font-bold group-hover:text-brand-accent transition-colors truncate">{item.title}</h3>
          </div>
          <div className="text-right ml-4">
            <p className="text-xl font-display font-bold">{item.price}</p>
          </div>
        </div>

        {/* Reputation Row - The "Honest Trust" section */}
        <div className="flex flex-col gap-1.5 pt-3 border-t border-brand-primary/5">
          {/* Product Rating */}
          <div className="flex items-center gap-1.5">
            {item.rating > 0 ? (
              <>
                <Star className="w-3 h-3 text-brand-accent fill-brand-accent" />
                <span className="text-[11px] font-bold text-brand-primary">{item.rating} Listing Rating</span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full bg-brand-accent/20"></span>
                <span className="text-[11px] font-bold text-brand-primary/40 uppercase tracking-widest">No Reviews Yet</span>
              </>
            )}
          </div>

          {/* Seller Reputation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-brand-primary/60">
              <span className="font-bold text-brand-accent">{sellerProfile?.avgRating || '0.0'} ★</span>
              <span>Seller Score</span>
              <span className="text-brand-primary/20">|</span>
              <span className="font-bold underline">{sellerProfile?.salesCount || 0} Sales</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Marketplace({ listings, searchFilters, onProductSelect, onOpenChat }) {
  const [activeType, setActiveType] = useState('All');
  const [wishlist, setWishlist] = useState([]);

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filtered = listings.filter(item => {
    const isApproved = item.status === 'approved';
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

          <div className="flex items-center gap-2 p-1 bg-brand-muted rounded-full">
            {['All', 'Sale', 'Rent'].map(type => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
            {filtered.map((item, i) => (
              <MarketplaceItem 
                key={item.id}
                item={item}
                index={i}
                onProductSelect={onProductSelect}
                isWishlisted={wishlist.includes(item.id)}
                onToggleWishlist={toggleWishlist}
                onOpenChat={onOpenChat}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
