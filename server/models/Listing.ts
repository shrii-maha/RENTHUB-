import mongoose, { Schema, Document } from 'mongoose';

export interface IListing extends Document {
  title: string;
  category: string;
  price: string;
  location: string;
  condition: string;
  description: string;
  securityDeposit?: string;
  type: 'Sale' | 'Rent';
  rating: number;
  image?: string;
  images: string[];
  sellerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'sold' | 'rented';
  createdAt: Date;
}

const ListingSchema = new Schema<IListing>({
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
}, { timestamps: true });

ListingSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    this.image = this.images[0];
  }
  next();
});

const Listing = mongoose.models.Listing || mongoose.model<IListing>('Listing', ListingSchema);
export default Listing;
