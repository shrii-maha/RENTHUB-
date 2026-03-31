import { motion } from "motion/react";
import { Users, Target, Award, Globe } from "lucide-react";

export default function AboutUs() {
  return (
    <section className="py-32 px-6 md:px-12 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-brand-primary/40 mb-4 block">About Us</span>
          <h2 className="text-5xl md:text-7xl font-display font-bold leading-tight italic">
            Welcome to <span className="text-brand-accent">RentHub</span>.
          </h2>
          <p className="mt-8 max-w-3xl mx-auto text-brand-primary/60 text-lg leading-relaxed">
            A modern platform designed to simplify the way people rent, share, and discover products and services.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <div className="relative aspect-square rounded-[3rem] overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=2070" 
              alt="Founder" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-8">
            <h3 className="text-4xl font-display font-bold italic">A Message from our Founder</h3>
            <div className="space-y-4 text-brand-primary/70 leading-relaxed">
              <p>
                I’m <strong>Srimanta Maharana</strong>, the founder of RentHub and currently pursuing my <strong>BSc IT (2026)</strong> with a strong passion for technology and innovation. 
                RentHub was built with a clear vision: to make renting anything easy, secure, and accessible for everyone.
              </p>
              <p>
                In today’s world, many people own items that are rarely used, while others are constantly looking for temporary access to those same things. 
                RentHub bridges this gap by creating a trusted platform where users can list, explore, and rent items—from villas and vehicles to everyday essentials.
              </p>
              <p>
                In today’s world, many people own items that are rarely used, while others are constantly looking for temporary access to those same things. 
                RentHub bridges this gap by creating a trusted platform where users can list, explore, and rent items—from villas and vehicles to everyday essentials.
              </p>
              <p>
                As an IT student, I wanted to build something practical and impactful. RentHub is not just a project; it’s a step toward creating a smart digital ecosystem that helps people earn, save, and share resources efficiently.
              </p>
            </div>
            <div className="pt-6 border-t border-brand-primary/10">
              <p className="font-display font-bold text-2xl italic text-brand-primary">Srimanta Maharana</p>
              <p className="text-xs font-mono uppercase tracking-widest text-brand-primary/40">Founder, RentHub • BSc IT (Pursuing, 2026)</p>
              <p className="text-xs font-mono text-brand-accent mt-1">Contact: 8097831527</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <h3 className="text-4xl font-display font-bold italic">What We Believe In</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Simplicity", desc: "A clean and easy-to-use platform" },
                { title: "Trust", desc: "Verified users and transparent reviews" },
                { title: "Accessibility", desc: "Rent anything, anytime, anywhere" },
                { title: "Innovation", desc: "Continuously improving with modern technologies" }
              ].map((item) => (
                <div key={item.title} className="glass p-6 rounded-2xl">
                  <h4 className="font-bold text-brand-accent mb-2">{item.title}</h4>
                  <p className="text-sm text-brand-primary/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-10 bg-brand-muted/30 rounded-[3rem] space-y-6">
            <h3 className="text-3xl font-display font-bold italic">The Journey Ahead</h3>
            <p className="text-brand-primary/70 leading-relaxed">
              RentHub is continuously evolving, and this is just the beginning. Our goal is to redefine how people access products and services through a smarter, community-driven platform.
            </p>
            <p className="text-brand-primary/70 leading-relaxed font-bold">
              Thank you for being part of our journey.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
