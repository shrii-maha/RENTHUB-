
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const ListingSchema = new mongoose.Schema({
  title: String,
  status: String,
  createdAt: Date
}, { strict: false });

const Listing = mongoose.model('Listing', ListingSchema);

async function checkToday() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    
    const items = await Listing.find({ 
      createdAt: { $gte: startOfToday } 
    }).sort({ createdAt: -1 });
    
    console.log(`ITEMS ADDED TODAY (since ${startOfToday.toISOString()}): ${items.length}\n`);
    items.forEach(l => {
      console.log(`[${l.status}] Title: ${l.title} | ID: ${l._id} | Created: ${l.createdAt.toISOString()}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkToday();
