import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  participants: [{
    type: String, // Clerk User IDs
    required: true
  }],
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: false
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
}, { timestamps: true });

// Ensure we don't have duplicate sessions for the same participants/listing
chatSessionSchema.index({ participants: 1, listingId: 1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;
