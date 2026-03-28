import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Listing from '../models/Listing.ts';

dotenv.config();

async function checkListings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const listings = await Listing.find();
    console.log(`Total listings found: ${listings.length}`);
    listings.forEach(l => {
      console.log(`- ${l.title}: [${l.status || 'NO STATUS'}] type: ${l.type}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkListings();
