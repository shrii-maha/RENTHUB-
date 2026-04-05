import { motion } from "motion/react";
import { Search, CreditCard, Key, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find What You Need",
    description: "Browse thousands of items from trusted owners in your local area or worldwide."
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description: "Pay securely through our encrypted platform with multiple payment options."
  },
  {
    icon: Key,
    title: "Rent & Enjoy",
    description: "Connect with the owner, pick up your item, and start your experience."
  },
  {
    icon: ShieldCheck,
    title: "Protected by RentHub",
    description: "Every rental is insured and protected by our comprehensive safety guarantee."
  }
];

interface HowItWorksProps {
  onOpenSell: () => void;
}

export default function HowItWorks({ onOpenSell }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="py-24 px-6 md:px-12 bg-brand-primary text-white overflow-hidden relative">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-white/40 mb-4 block">Process</span>
          <h2 className="text-5xl md:text-7xl font-display font-bold leading-tight italic">
            How RentHub <br />
            <span className="text-brand-accent">Works</span> for You.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-brand-accent group-hover:text-brand-primary transition-all duration-500 transform group-hover:rotate-12">
                <step.icon className="w-10 h-10" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs font-mono text-brand-accent">0{i + 1}</span>
                <h3 className="text-2xl font-display font-bold">{step.title}</h3>
              </div>
              <p className="text-white/60 leading-relaxed text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 p-12 glass rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-left">
            <h3 className="text-3xl font-display font-bold mb-2">Ready to list your own item?</h3>
            <p className="text-white/60">Join thousands of owners making passive income every day.</p>
          </div>
          <button onClick={onOpenSell} className="px-10 py-5 bg-brand-accent text-brand-primary rounded-full font-bold text-lg hover:scale-105 transition-transform">
            Start Listing Today
          </button>
        </div>
      </div>
    </section>
  );
}
