import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true,
    unique: true // Ensure one review per order
  },
  listingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing', 
    required: true 
  },
  buyerId: { 
    type: String, 
    required: true // Store the email or clerk ID
  },
  sellerId: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    required: true,
    trim: true,
    maxLength: 1000
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Prevent duplicate models during development/hot reload
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

export default Review;
