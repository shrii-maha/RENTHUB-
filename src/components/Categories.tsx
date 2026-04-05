import { motion } from "motion/react";
import { Home, Wrench, Car, Smartphone, Watch, Shirt, Sofa, Package } from "lucide-react";

const categories = [
  { name: "Real Estate", icon: Home, count: "View listings" },
  { name: "Tools & Hardware", icon: Wrench, count: "View listings" },
  { name: "Vehicle", icon: Car, count: "View listings" },
  { name: "Electronics", icon: Smartphone, count: "View listings" },
  { name: "Luxury Watches", icon: Watch, count: "View listings" },
  { name: "Fashion", icon: Shirt, count: "View listings" },
  { name: "Furniture", icon: Sofa, count: "View listings" },
  { name: "General Items", icon: Package, count: "View listings" },
];

interface CategoriesProps {
  onCategorySelect: (category: string) => void;
}

export default function Categories({ onCategorySelect }: CategoriesProps) {
  return (
    <section className="py-24 px-6 md:px-12 bg-brand-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-primary/40 mb-4 block">Categories</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold leading-tight">
              Explore Our <br />
              <span className="italic text-brand-accent">Curated</span> Collections.
            </h2>
          </div>
          <button 
            onClick={() => onCategorySelect("")}
            className="text-sm font-mono uppercase tracking-widest text-brand-primary/60 hover:text-brand-primary transition-colors border-b border-brand-primary/20 pb-1"
          >
            View All Categories
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              onClick={() => onCategorySelect(cat.name)}
              className="group glass p-8 rounded-3xl flex flex-col items-center text-center hover:bg-brand-primary hover:text-white transition-all duration-500 cursor-pointer"
            >
              <div className="w-16 h-16 bg-brand-muted rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                <cat.icon className="w-8 h-8 text-brand-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">{cat.name}</h3>
              <p className="text-xs font-mono uppercase tracking-widest opacity-40 group-hover:opacity-60">{cat.count}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
