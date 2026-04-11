import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Categories from "./components/Categories";
import FeaturedListings from "./components/FeaturedListings";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";
import AddItemModal from "./components/AddItemModal";
import AdminPanel from "./components/AdminPanel";
import Marketplace from "./components/Marketplace";
import FounderCard from "./components/FounderCard";
import CheckoutModal from "./components/CheckoutModal";
import UserDashboard from "./components/UserDashboard";
import InsurancePolicy from "./components/InsurancePolicy";
import AboutUs from "./components/AboutUs";
import Contact from "./components/Contact";
import PrivacyPolicy from "./components/PrivacyPolicy";
import DeliveryPolicy from "./components/DeliveryPolicy";
import ChatBot from "./components/ChatBot";
import FloatingChat from "./components/FloatingChat";
import { motion, useScroll, useSpring } from "motion/react";
import { useUser, useClerk } from "@clerk/clerk-react";

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  
  const handleNavigate = (section) => {
    if (section === 'how-it-works') {
      setActiveSection('home');
      setTimeout(() => {
        const element = document.getElementById('how-it-works');
        if (element) {
          const navHeight = 80; // height of fixed navbar
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementPosition - navHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      setActiveSection(section);
    }
  };
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('dashboard');
  const [listings, setListings] = useState([]);
  const [searchFilters, setSearchFilters] = useState();

  const { user } = useUser();

  useEffect(() => {
    if (user) {
      const syncUser = async () => {
        try {
          await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              fullName: user.fullName || user.firstName || ''
            })
          });
        } catch (err) {
          console.error('Failed to sync user', err);
        }
      };
      syncUser();
      
      // Ping every 5 minutes to keep "online" status fresh
      const interval = setInterval(syncUser, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Fetch listings from API on mount
  useEffect(() => {
    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((item) => ({
            ...item,
            id: item._id || item.id,
          }));
          setListings(mapped);
        }
      })
      .catch(() => {
        // Server not running — use hardcoded listings
        console.log('Backend not available, using local data');
      });
  }, []);

  const handleAddListing = async (newItem) => {
    console.log('📡 Fetching /api/listings with:', newItem.title);
    
    // Add a 30-second timeout to the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('📥 Response received. Status:', res.status);
      const contentType = res.headers.get("content-type");
      let errorData;
      
      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          errorData = await res.json();
        }
        console.error('❌ Server Error:', errorData?.error || res.statusText);
        throw new Error(errorData?.error || `Server responded with ${res.status}. Please ensure your backend is running on port 3001.`);
      }

      if (contentType && contentType.includes("application/json")) {
        const saved = await res.json();
        console.log('✅ Success! Saved ID:', saved._id);
        const mappedItem = { ...saved, id: saved._id || saved.id };
        setListings(prev => [mappedItem, ...prev]);
        return mappedItem;
      } else {
        console.error('❌ Invalid Content-Type:', contentType);
        throw new Error("Invalid response from server. Check your backend terminal (Port 3001).");
      }
    } catch (err) {
      console.error('💥 Listing error:', err.message);
      throw err;
    }
  };

  const handleDeleteListing = async (id) => {
    try {
      await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    } catch {
      // Continue with local delete even if API fails
    }
    setListings(listings.filter(item => item.id !== id));
  };

  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const handleProductSelect = (product) => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    setSelectedProduct(product);
    setIsCheckoutModalOpen(true);
  };

  const handleOpenChat = async (sellerId, listingId) => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    
    // Open floating chat immediately for responsiveness
    setIsFloatingChatOpen(true);
    
    try {
      // Create session in background
      await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: [user.id, sellerId],
          listingId
        })
      });
    } catch (err) {
      console.error('Background session creation failed:', err);
    }
  };

  const handleSearch = (filters) => {
    setSearchFilters(filters);
    setActiveSection('items');
  };

  const handleCategorySelect = (category) => {
    setSearchFilters({ location: "", dates: "", category });
    setActiveSection('items');
  };

  const handleOrderSuccess = (productId) => {
    // Remove the product from the current marketplace listings
    setListings(prev => prev.filter(item => item.id !== productId));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSection]);

  return (
    <div className="relative min-h-screen bg-white">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-brand-accent z-[60] origin-left"
        style={{ scaleX }}
      />

      <Navbar 
        onOpenSell={() => {
          if (!isSignedIn) {
            openSignIn();
            return;
          }
          setIsSellModalOpen(true);
        }} 
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
        onNavigate={handleNavigate}
        activeSection={activeSection}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onCategorySelect={handleCategorySelect}
      />
      
      <main>
        {activeSection === 'home' && (
          <>
            <Hero onSearch={handleSearch} />
            <Categories onCategorySelect={handleCategorySelect} />
            <FeaturedListings onProductSelect={handleProductSelect} listings={listings} onOpenChat={handleOpenChat} />
            <HowItWorks onOpenSell={() => {
              if (!isSignedIn) {
                openSignIn();
                return;
              }
              setIsSellModalOpen(true);
            }} />
            
            <FounderCard />

            <section className="py-24 px-6 md:px-12 bg-brand-muted/30">
              <div className="max-w-7xl mx-auto glass p-12 md:p-24 rounded-[4rem] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-accent/5 to-transparent z-0"></div>
                <div className="relative z-10">
                  <h2 className="text-5xl md:text-8xl font-display font-bold leading-none tracking-tighter mb-8">
                    Start Your <br />
                    <span className="italic text-brand-accent underline decoration-brand-accent/30 underline-offset-8">Marketplace Journey</span> Today.
                  </h2>
                  <p className="max-w-2xl mx-auto text-brand-primary/60 text-lg mb-12 leading-relaxed">
                    Join over 2 million users worldwide who are buying, selling, and renting resources. 
                    Whether you're looking for a luxury villa or a simple drill, we've got you covered.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => handleCategorySelect("")}
                      className="w-full sm:w-auto px-12 py-6 bg-brand-primary text-white rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-2xl shadow-brand-primary/20"
                    >
                      Explore Marketplace
                    </button>
                    <button 
                      onClick={() => {
                        if (!isSignedIn) {
                          openSignIn();
                          return;
                        }
                        setIsSellModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-12 py-6 bg-white border border-brand-primary/10 text-brand-primary rounded-full font-bold text-xl hover:bg-brand-muted transition-colors"
                    >
                      Sell an Item
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeSection === 'items' && (
          <Marketplace 
            listings={listings} 
            searchFilters={searchFilters} 
            onProductSelect={handleProductSelect}
            onOpenChat={handleOpenChat}
          />
        )}

        {activeSection === 'insurance' && (
          <InsurancePolicy />
        )}

        {activeSection === 'about' && (
          <AboutUs />
        )}

        {activeSection === 'contact' && (
          <Contact />
        )}

        {activeSection === 'privacy' && (
          <PrivacyPolicy />
        )}

        {activeSection === 'delivery' && (
          <DeliveryPolicy />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        product={selectedProduct}
        onOrderSuccess={handleOrderSuccess}
      />

      <AddItemModal 
        isOpen={isSellModalOpen} 
        onClose={() => setIsSellModalOpen(false)} 
        onAdd={handleAddListing}
      />

      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
        listings={listings}
        onDelete={handleDeleteListing}
      />

      <UserDashboard 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)} 
        listings={listings}
        onOpenSell={() => {
          if (!isSignedIn) {
            openSignIn();
            return;
          }
          setIsDashboardOpen(false);
          setIsSellModalOpen(true);
        }}
        initialTab={dashboardTab}
      />

      <FloatingChat 
        isOpen={isFloatingChatOpen} 
        onOpenToggle={setIsFloatingChatOpen} 
      />

      <ChatBot />
    </div>
  );
}
