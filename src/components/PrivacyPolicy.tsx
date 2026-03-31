import { motion } from "motion/react";

export default function PrivacyPolicy() {
  return (
    <section className="py-32 px-6 md:px-12 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-brand-primary/40 mb-4 block">Legal</span>
          <h2 className="text-5xl md:text-7xl font-display font-bold leading-tight italic mb-8">
            Privacy <span className="text-brand-accent">Policy</span>.
          </h2>
          <p className="text-brand-primary/40 font-mono text-xs">Last Updated: March 31, 2026</p>
        </motion.div>

        <div className="prose prose-brand max-w-none space-y-12 text-brand-primary/70 leading-relaxed">
          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold text-brand-primary italic">1. Introduction</h3>
            <p>
              At RentHub, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information 
              when you use our platform. By accessing RentHub, you agree to the terms outlined in this document.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold text-brand-primary italic">2. Information We Collect</h3>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (name, email, profile photo)</li>
              <li>Identity verification data (government ID for high-value rentals)</li>
              <li>Payment information (processed securely via our payment partners)</li>
              <li>Listing details and communication between users</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold text-brand-primary italic">3. How We Use Your Information</h3>
            <p>Your data is used to facilitate rentals, ensure safety, and improve our services. Specifically:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To verify identities and prevent fraud</li>
              <li>To process payments and insurance claims</li>
              <li>To provide customer support and resolve disputes</li>
              <li>To personalize your experience and show relevant listings</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold text-brand-primary italic">4. Data Security</h3>
            <p>
              We implement industry-standard security measures to protect your data. All sensitive information is encrypted 
              both in transit and at rest. We never sell your personal data to third parties.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold text-brand-primary italic">5. Your Rights</h3>
            <p>
              You have the right to access, correct, or delete your personal information at any time through your account settings. 
              For data portability requests, please contact our privacy team.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
