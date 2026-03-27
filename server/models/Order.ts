import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  listingId: mongoose.Types.ObjectId;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: 'escrow' | 'released' | 'refunded';
  paymentMethod: 'card' | 'upi';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  buyerId: { type: String, required: true },
  sellerId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['escrow', 'released', 'refunded'], default: 'escrow' },
  paymentMethod: { type: String, enum: ['card', 'upi'], required: true },
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);
