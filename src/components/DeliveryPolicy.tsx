import { motion } from "motion/react";
import { Truck, ShieldCheck, CheckCircle, Package } from "lucide-react";

export default function DeliveryPolicy() {
  return (
    <section className="py-32 px-6 md:px-12 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-brand-primary/40 mb-4 block">Delivery</span>
          <h2 className="text-5xl md:text-7xl font-display font-bold leading-tight italic mb-8">
            Secure & <br /> Convenient <span className="text-brand-accent">Delivery</span>.
          </h2>
          <p className="text-brand-primary/40 font-mono text-xs">Last Updated: April 5, 2026</p>
        </motion.div>

        <div className="prose prose-brand max-w-none space-y-12 text-brand-primary/70 leading-relaxed">
          <p className="text-xl font-medium leading-relaxed">
            After renting or buying a product on RentHub, you'll receive your item through our secure and streamlined delivery process. We ensure your funds and items are protected every step of the way.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
            {[
              {
                icon: ShieldCheck,
                title: "1. Payment & Escrow",
                desc: "Once you've paid for the rental, your funds are securely held in Escrow. This ensures your money is safe until the product is successfully delivered."
              },
              {
                icon: Truck,
                title: "2. Shipping & Tracking",
                desc: "After the seller ships the product, you'll receive real-time updates and tracking information directly on your dashboard."
              },
              {
                icon: CheckCircle,
                title: "3. Delivery Confirmation",
                desc: "Once you receive the product and verify its condition, you simply confirm the delivery on the RentHub platform."
              },
              {
                icon: Package,
                title: "4. Escrow Release",
                desc: "Upon your confirmation, the funds are released to the seller, completing the secure transaction."
              }
            ].map((step, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-brand-muted/30 p-8 rounded-3xl"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <step.icon className="w-6 h-6 text-brand-accent" />
                </div>
                <h4 className="text-xl font-display font-bold text-brand-primary mb-3">{step.title}</h4>
                <p className="text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="space-y-6 mt-16 pb-8 border-b border-brand-primary/10">
            <h3 className="text-3xl font-display font-bold text-brand-primary italic">Available Delivery Options</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-brand-accent mt-2 flex-shrink-0" />
                <p><strong className="text-brand-primary">Direct Shipping:</strong> Sellers can choose to ship the product to you directly using standard carriers.</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-brand-accent mt-2 flex-shrink-0" />
                <p><strong className="text-brand-primary">In-person Pickup:</strong> Depending on the location, you might be able to pick up the product in person from the seller for a faster handover.</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-brand-accent mt-2 flex-shrink-0" />
                <p><strong className="text-brand-primary">RentHub Partner Delivery:</strong> In select areas, RentHub has partnered with local delivery services to ensure fast, insured, and reliable delivery.</p>
              </li>
            </ul>
          </div>

          <div className="bg-brand-primary text-white p-10 rounded-[3rem] mt-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <h3 className="text-2xl font-display font-bold mb-4 relative z-10">We've got you covered!</h3>
            <p className="text-white/70 relative z-10">
              If you have any issues with the delivery or the product itself, you can always reach out to our dedicated Support Team for assistance. Our comprehensive insurance and protection plans ensure peace of mind.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
