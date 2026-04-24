import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';

dotenv.config();

async function verifyAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.updateMany({}, { $set: { isVerified: true } });
  console.log('All existing users have been marked as verified.');
  await mongoose.disconnect();
}

verifyAll();
