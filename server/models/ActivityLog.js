import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  actionType: {
    type: String,
    enum: ['rental', 'approval', 'system', 'payout'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
