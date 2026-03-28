import React, { useState, useRef } from "react";
import { X, Upload, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "@clerk/clerk-react";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
}

export default function AddItemModal({ isOpen, onClose, onAdd }: AddItemModalProps) {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreviews(prev => [...prev, ev.target?.result as string].slice(0, 5));
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
    if (!formData.image && imagePreviews.length === 0) {
      alert('Please upload a product image');
      return;
    }

    const newItem = {
      ...formData,
      image: formData.image || imagePreviews[0] || '',
      id: Math.random().toString(36).substr(2, 9),
      rating: 5.0,
      sellerId: user?.id || "anonymous",
      createdAt: new Date().toISOString(),
    };

    onAdd(newItem);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "", category: "General Items", price: "", condition: "New",
      location: "", securityDeposit: "", description: "", type: "Sale", image: "",
    });
    setImagePreviews([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 640,
              background: 'white', borderRadius: 24, overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
              maxHeight: '90vh', overflowY: 'auto',
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}
          >
            <div style={{ padding: '32px 36px 40px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>List a New Product</h2>
                <button
                  onClick={() => { onClose(); resetForm(); }}
                  style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Image Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: imagePreviews.length > 0 ? '2px solid #22c55e' : '2px dashed #E5E7EB',
                    borderRadius: 20, padding: imagePreviews.length > 0 ? 16 : 40,
                    textAlign: 'center', marginBottom: 30, cursor: 'pointer',
                    background: imagePreviews.length > 0 ? '#f0fdf4' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />

                  {imagePreviews.length > 0 ? (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {imagePreviews.map((src, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img
                            src={src}
                            alt={`Preview ${i + 1}`}
                            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 12 }}
                          />
                          {i === 0 && (
                            <div style={{
                              position: 'absolute', top: 4, right: 4,
                              background: '#22c55e', color: 'white', borderRadius: 20,
                              padding: '2px 8px', fontSize: 10, fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: 3,
                            }}>
                              <Check size={10} /> Main
                            </div>
                          )}
                        </div>
                      ))}
                      <div
                        style={{
                          width: 100, height: 100, border: '2px dashed #d1d5db',
                          borderRadius: 12, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: '#9CA3AF',
                        }}
                      >
                        <Upload size={20} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        background: '#F3F4F6', width: 50, height: 50, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 15px',
                      }}>
                        {uploading ? (
                          <div style={{ width: 24, height: 24, border: '2px solid #d1d5db', borderTop: '2px solid #D4900A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Upload size={24} color="#333" />
                        )}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, color: '#1a1a1a' }}>
                        {uploading ? 'Uploading...' : 'Click to upload product images'}
                      </div>
                      <div style={{ color: '#9CA3AF', fontSize: 13 }}>PNG, JPG up to 10MB (Select up to 5)</div>
                    </>
                  )}
                </div>

                {/* Row 1: Title & Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 25 }}>
                  <div>
                    <label style={labelStyle}>Product Title</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Vintage Camera"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      style={{ ...inputStyle, appearance: 'none' as any }}
                    >
                      <option>General Items</option>
                      <option>Real Estate</option>
                      <option>Tools &amp; Hardware</option>
                      <option>Vehicles</option>
                      <option>Electronics</option>
                      <option>Luxury Watches</option>
                      <option>Fashion</option>
                      <option>Furniture</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Price & Condition */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 25 }}>
                  <div>
                    <label style={labelStyle}>Price (INR)</label>
                    <input
                      required
                      type="text"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. ₹1,200"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Condition</label>
                    <select
                      value={formData.condition}
                      onChange={e => setFormData({ ...formData, condition: e.target.value })}
                      style={{ ...inputStyle, appearance: 'none' as any }}
                    >
                      <option>New</option>
                      <option>Like New</option>
                      <option>Used - Good</option>
                      <option>Used - Fair</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Location & Security Deposit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 25 }}>
                  <div>
                    <label style={labelStyle}>Location</label>
                    <input
                      required
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Mumbai, India"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Security Deposit (INR)</label>
                    <input
                      type="text"
                      value={formData.securityDeposit}
                      onChange={e => setFormData({ ...formData, securityDeposit: e.target.value })}
                      placeholder="e.g. ₹500 (Optional)"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 25 }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the item and any rental rules..."
                    style={{
                      ...inputStyle,
                      height: 100, resize: 'none' as any,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Listing Type */}
                <label style={labelStyle}>Listing Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 40 }}>
                  {['Sale', 'Rent'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      style={{
                        padding: 18,
                        background: formData.type === type ? '#1a1a1a' : 'white',
                        color: formData.type === type ? 'white' : '#1a1a1a',
                        border: formData.type === type ? 'none' : '1px solid #E5E7EB',
                        borderRadius: 14, fontWeight: 700, cursor: 'pointer',
                        fontSize: 14, transition: 'all 0.15s',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    width: '100%', padding: 22,
                    background: uploading ? '#666' : '#1a1a1a',
                    color: 'white', border: 'none', borderRadius: 50,
                    fontWeight: 700, fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Check size={20} />
                  {uploading ? 'Uploading...' : 'Publish Listing'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#9CA3AF', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.5px',
  marginBottom: 8, display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '16px 20px',
  background: '#F3F4F6', border: 'none',
  borderRadius: 14, outline: 'none',
  boxSizing: 'border-box', fontSize: 14,
  fontFamily: 'inherit', color: '#1a1a1a',
};
