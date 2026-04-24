import mongoose from 'mongoose';

const ChatSessionSchema = new mongoose.Schema({
  participants: [{
    type: String, // emails
    required: true
  }],
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema);
