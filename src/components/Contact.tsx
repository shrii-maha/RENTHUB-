import { motion } from "motion/react";
import { Mail, MessageSquare, Phone, MapPin, Send } from "lucide-react";

export default function Contact() {
  return (
    <section className="py-32 px-6 md:px-12 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-brand-primary/40 mb-4 block">Get in Touch</span>
          <h2 className="text-5xl md:text-7xl font-display font-bold leading-tight italic">
            We're Here <br />
            to <span className="text-brand-accent">Help</span> You.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass p-8 rounded-[2rem]">
                <Mail className="w-8 h-8 text-brand-accent mb-4" />
                <h4 className="font-bold mb-1">Email Us</h4>
                <p className="text-sm text-brand-primary/60">support@renthub.com</p>
              </div>
              <div className="glass p-8 rounded-[2rem]">
                <Phone className="w-8 h-8 text-brand-accent mb-4" />
                <h4 className="font-bold mb-1">Call Us</h4>
                <p className="text-sm text-brand-primary/60">8097831527</p>
              </div>
              <div className="glass p-8 rounded-[2rem]">
                <MessageSquare className="w-8 h-8 text-brand-accent mb-4" />
                <h4 className="font-bold mb-1">Live Chat</h4>
                <p className="text-sm text-brand-primary/60">Available 24/7</p>
              </div>
              <div className="glass p-8 rounded-[2rem]">
                <MapPin className="w-8 h-8 text-brand-accent mb-4" />
                <h4 className="font-bold mb-1">Office</h4>
                <p className="text-sm text-brand-primary/60">Vidyavihar, Mumbai</p>
              </div>
            </div>

            <div className="p-10 bg-brand-muted/30 rounded-[3rem]">
              <h3 className="text-2xl font-display font-bold mb-4">Help Center</h3>
              <p className="text-brand-primary/60 mb-6">Find answers to common questions about rentals, insurance, and payments.</p>
              <button className="px-8 py-4 bg-brand-primary text-white rounded-full font-bold hover:scale-105 transition-transform">
                Visit Help Center
              </button>
            </div>
          </div>

          <div className="glass p-10 md:p-16 rounded-[4rem]">
            <h3 className="text-3xl font-display font-bold mb-8">Send a Message</h3>
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-brand-primary/40">Full Name</label>
                <input type="text" className="w-full bg-brand-muted border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-accent outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-brand-primary/40">Email Address</label>
                <input type="email" className="w-full bg-brand-muted border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-accent outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-brand-primary/40">Message</label>
                <textarea rows={4} className="w-full bg-brand-muted border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-accent outline-none resize-none" />
              </div>
              <button className="w-full py-5 bg-brand-primary text-white rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
