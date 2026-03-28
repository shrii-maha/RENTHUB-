
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
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

const Listing = mongoose.model('Listing', ListingSchema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Listing.countDocuments();
    const latest = await Listing.find().sort({ createdAt: -1 }).limit(10);
    console.log(`TOTAL LISTINGS IN DB: ${count}\n`);
    console.log('--- LATEST 10 LISTINGS ---');
    latest.forEach(l => {
      console.log(`[${l.status}] Title: ${l.title} | ID: ${l._id} | CreatedAt: ${l.createdAt.toISOString()}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
