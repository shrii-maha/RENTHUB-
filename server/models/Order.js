import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  buyerId: {
    type: String, // email
    required: true,
    index: true
  },
  sellerId: {
    type: String, // email
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['escrow', 'shipped', 'delivered', 'released', 'payout_requested', 'paid', 'disputed'],
    default: 'escrow',
    index: true
  },
  paymentIntentId: {
    type: String,
    default: ''
  },
  trackingNumber: {
    type: String,
    default: ''
  },
  shippingNote: {
    type: String,
    default: ''
  },
  deliveryMethod: {
    type: String,
    default: 'shipping'
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
