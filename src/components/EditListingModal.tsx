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
    images: [] as string[],
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
        images: listing.images || (listing.image ? [listing.image] : []),
      });
      setImagePreview(listing.image || "");
    }
  }, [listing]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - formData.images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      alert("Maximum 5 images allowed.");
      return;
    }

    setUploading(true);
    
    for (const file of filesToUpload) {
      // Upload to server
      try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) {
          setFormData(prev => {
            const nextImages = [...prev.images, data.url];
            return { 
              ...prev, 
              images: nextImages,
              image: nextImages[0]
            };
          });
          if (formData.images.length === 0) {
            setImagePreview(data.url);
          }
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const nextImages = prev.images.filter((_, i) => i !== index);
      const nextImage = nextImages.length > 0 ? nextImages[0] : "";
      setImagePreview(nextImage);
      return { 
        ...prev, 
        images: nextImages,
        image: nextImage 
      };
    });
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
                        <label style={labelStyle}>Product Images (Max 5)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                            {formData.images.map((img, idx) => (
                                <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        style={{
                                            position: 'absolute', top: 8, right: 8,
                                            background: 'rgba(255,255,255,0.9)', border: 'none',
                                            borderRadius: '50%', width: 24, height: 24,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', color: '#ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                    {idx === 0 && (
                                        <div style={{ position: 'absolute', bottom: 8, left: 8, background: '#000', color: '#fff', fontSize: '8px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                            Main
                                        </div>
                                    )}
                                </div>
                            ))}
                            {formData.images.length < 5 && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: '2px dashed #E5E7EB',
                                        borderRadius: 16, 
                                        aspectRatio: '1',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        background: '#F9FAFB',
                                        transition: 'all 0.2s',
                                    }}
                                    className="hover:border-black hover:bg-gray-50"
                                >
                                    <Upload size={20} className="text-gray-400" />
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#9CA3AF', marginTop: '8px', textTransform: 'uppercase' }}>Add</span>
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                        
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
