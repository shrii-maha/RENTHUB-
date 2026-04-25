import { motion } from "motion/react";
import { Star, MapPin, Heart, ArrowUpRight, MessageSquare } from "lucide-react";

export default function FeaturedListings({ onProductSelect, listings, onOpenChat }) {
  // Show promoted items first, then most recent (Only approved ones)
  const featuredDisplay = listings
    .filter(item => item.status === 'approved')
    .sort((a, b) => {
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    })
    .slice(0, 3);

  if (listings.length === 0) return null;

  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-primary/40 mb-4 block">Marketplace</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold leading-tight">
              Featured <br />
              <span className="italic text-brand-accent">Products</span> & Assets.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {featuredDisplay.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
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
                    <span>{item.rating || 5.0}</span>
                  </div>
                  <p className="text-xl font-display font-bold">
                    {item.price}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
