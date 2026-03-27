import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  actionType: 'payout' | 'rental' | 'report' | 'system';
  message: string;
  details: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  actionType: { type: String, enum: ['payout', 'rental', 'report', 'system'], required: true },
  message: { type: String, required: true },
  details: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
