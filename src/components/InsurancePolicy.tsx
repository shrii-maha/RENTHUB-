import { motion } from "motion/react";
import { ShieldCheck, Umbrella, FileText, CheckCircle2, AlertCircle, Info } from "lucide-react";

export default function InsurancePolicy() {
  const coverageItems = [
    {
      icon: Umbrella,
      title: "Damage Protection",
      description: "Coverage for accidental damage to items during the rental period, up to $50,000 per claim."
    },
    {
      icon: ShieldCheck,
      title: "Theft & Loss",
      description: "Protection against theft or total loss of high-value assets with verified police reports."
    },
    {
      icon: FileText,
      title: "Liability Coverage",
      description: "General liability protection for both owners and renters during the usage of rented equipment."
    }
  ];

  const faqs = [
    {
      q: "How do I file a claim?",
      a: "Claims can be filed directly through your dashboard within 24 hours of the incident. You'll need to provide photos and a detailed description."
    },
    {
      q: "Is there a deductible?",
      a: "Most standard rentals have a $50 deductible. High-value assets like luxury vehicles or villas may have specific deductible tiers."
    },
    {
      q: "What is excluded from coverage?",
      a: "Intentional damage, normal wear and tear, and usage outside of the agreed-upon terms are not covered by our standard policy."
    }
  ];

  return (
    <section className="py-32 px-6 md:px-12 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-brand-primary/40 mb-4 block">Safety & Trust</span>
          <h2 className="text-5xl md:text-7xl font-display font-bold leading-tight italic">
            RentHub <span className="text-brand-accent">Insurance</span> <br />
            Policy & Protection.
          </h2>
          <p className="mt-8 max-w-2xl mx-auto text-brand-primary/60 text-lg leading-relaxed">
            Your peace of mind is our top priority. Every transaction on RentHub is backed by our 
            comprehensive protection plan, ensuring both owners and renters are covered.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {coverageItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-10 rounded-[3rem] hover:bg-brand-muted transition-colors"
            >
              <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center mb-8 text-brand-accent">
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">{item.title}</h3>
              <p className="text-brand-primary/60 text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div>
              <h3 className="text-3xl font-display font-bold mb-6 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                What's Included
              </h3>
              <ul className="space-y-4">
                {[
                  "24/7 Priority Support for incidents",
                  "Verified Renter Identity checks",
                  "Secure Escrow payment protection",
                  "Dispute resolution assistance",
                  "Asset condition documentation"
                ].map((text) => (
                  <li key={text} className="flex items-center gap-3 text-brand-primary/70">
                    <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 bg-brand-muted/50 rounded-[2rem] border border-brand-primary/5">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-brand-accent shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold mb-2">Important Note</h4>
                  <p className="text-sm text-brand-primary/60 leading-relaxed">
                    Insurance coverage is only valid for transactions completed through the RentHub platform. 
                    Off-platform arrangements are not covered and violate our Terms of Service.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass p-12 rounded-[3rem]"
          >
            <h3 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
              <Info className="w-8 h-8 text-brand-accent" />
              Common Questions
            </h3>
            <div className="space-y-8">
              {faqs.map((faq) => (
                <div key={faq.q}>
                  <h4 className="font-bold text-lg mb-2">{faq.q}</h4>
                  <p className="text-brand-primary/60 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
            <button className="mt-12 w-full py-4 bg-brand-primary text-white rounded-full font-bold hover:scale-105 transition-transform">
              Read Full Policy Document
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
