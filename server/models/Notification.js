import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: String, // email
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
