import mongoose, { Schema, Document } from 'mongoose';

export interface IListing extends Document {
  title: string;
  category: string;
  price: string;
  location: string;
  type: 'Sale' | 'Rent';
  rating: number;
  image: string;
  sellerId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const ListingSchema = new Schema<IListing>({
  title: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ['Sale', 'Rent'], required: true },
  rating: { type: Number, default: 5.0 },
  image: { type: String, required: true },
  sellerId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model<IListing>('Listing', ListingSchema);
