import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Listing from '../models/Listing.js';

dotenv.config();

async function updateListings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
    
    // Update all items without a status to 'approved'
    const result = await Listing.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'approved' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} items to 'approved' status.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating listings:', err);
    process.exit(1);
  }
}

updateListings();
