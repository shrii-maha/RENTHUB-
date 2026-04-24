import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: String, required: true },
  location: { type: String, required: true },
  condition: { type: String, default: 'New' },
  description: { type: String, default: '' },
  securityDeposit: { type: String, default: '' },
  type: { type: String, enum: ['Sale', 'Rent'], required: true },
  rating: { type: Number, default: 5.0 },
  image: { type: String },
  images: { type: [String], default: [] },
  sellerId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'sold', 'rented'], default: 'pending' },
  lat: { type: Number },
  lng: { type: Number }
}, { timestamps: true });

ListingSchema.pre('save', function() {
  if (this.images && this.images.length > 0) {
    this.image = this.images[0];
  }
});

const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
export default Listing;
