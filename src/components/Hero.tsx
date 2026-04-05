import { motion } from "motion/react";
import SearchBar from "./SearchBar";

interface HeroProps {
  onSearch?: (filters: { location: string; dates: string; category: string }) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2070"
          alt="Luxury Villa"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-white"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-xs font-mono uppercase tracking-[0.2em] mb-6">
            Premium Rentals for Everyone
          </span>
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-display font-bold text-white leading-[0.85] tracking-tighter mb-8 italic">
            Rent <span className="text-brand-accent">Anything</span>,<br />
            List Everything.
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex justify-center"
          style={{ position: 'relative', zIndex: 50 }}
        >
          <SearchBar onSearch={onSearch || (() => {})} />
        </motion.div>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
        <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-brand-primary/20">Scroll to explore</p>
        <div className="w-px h-10 bg-gradient-to-b from-brand-primary/20 to-transparent"></div>
      </div>
    </section>
  );
}
