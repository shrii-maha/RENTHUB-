import React, { useState, useRef, useEffect } from "react";
import { X, Upload, Check, Save, Trash2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any;
  onUpdate: (id: string, updatedData: any) => void;
}

export default function EditListingModal({ isOpen, onClose, listing, onUpdate }: EditListingModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    category: "General Items",
    price: "",
    condition: "New",
    location: "",
    securityDeposit: "",
    description: "",
    type: "Sale",
    image: "",
  });

  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || "",
        category: listing.category || "General Items",
        price: listing.price || "",
        condition: listing.condition || "New",
        location: listing.location || "",
        securityDeposit: listing.securityDeposit || "",
        description: listing.description || "",
        type: listing.type || "Sale",
        image: listing.image || "",
      });
      setImagePreview(listing.image || "");
    }
  }, [listing]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, image: data.url }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(listing._id, formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 720,
              background: 'white', borderRadius: 32, overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh', overflowY: 'auto',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <div style={{ padding: '40px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 35 }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                        <Save className="text-brand-accent w-6 h-6" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', margin: 0, letterSpacing: '-0.5px' }}>Edit Metadata</h2>
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{listing?._id}</span>
                    </div>
                </div>
                <button
                  onClick={onClose}
                  style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr] gap-10">
                    {/* Left: Image Panel */}
                    <div>
                        <label style={labelStyle}>Featured Image</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: '2px dashed #E5E7EB',
                                borderRadius: 24, 
                                aspectRatio: '1',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                background: '#F9FAFB',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            className="hover:border-black group"
                        >
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <div className="bg-white/90 p-4 rounded-2xl scale-90 group-hover:scale-100 transition-transform">
                                            <Upload size={24} color="#000" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                                    <Upload size={32} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Update Photo</span>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </div>
                        {uploading && (
                            <div className="mt-4 flex items-center gap-3 text-xs font-bold text-gray-500 animate-pulse">
                                <div className="w-4 h-4 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                                Uploading to Grid...
                            </div>
                        )}
                    </div>

                    {/* Right: Fields */}
                    <div className="space-y-6">
                        <div>
                            <label style={labelStyle}>Product Title</label>
                            <input
                                required type="text" value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                style={inputStyle} className="focus:shadow-lg focus:shadow-black/5"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label style={labelStyle}>Category</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={inputStyle}>
                                    <option>General Items</option>
                                    <option>Real Estate</option>
                                    <option>Tools & Hardware</option>
                                    <option>Vehicles</option>
                                    <option>Electronics</option>
                                    <option>Luxury Watches</option>
                                    <option>Fashion</option>
                                    <option>Furniture</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Asset Price</label>
                                <input required type="text" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={inputStyle} />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Location</label>
                            <input required type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} style={inputStyle} />
                        </div>

                        <div>
                            <label style={labelStyle}>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{ ...inputStyle, height: 100, borderRadius: 20, resize: 'none' }}
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-[11px]"
                            >
                                Discard Changes
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="flex-1 py-4 bg-black text-white font-bold rounded-2xl hover:shadow-2xl shadow-black/20 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <Save size={16} /> Update Asset
                            </button>
                        </div>
                    </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, color: '#9CA3AF', fontWeight: 800,
  textTransform: 'uppercase', letterSpacing: '1px',
  marginBottom: 10, display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '18px 24px',
  background: '#F9FAFB', border: '1px solid #F3F4F6',
  borderRadius: 18, outline: 'none',
  boxSizing: 'border-box', fontSize: 15,
  fontFamily: 'inherit', color: '#1a1a1a',
  fontWeight: 600, transition: 'all 0.2s',
};
