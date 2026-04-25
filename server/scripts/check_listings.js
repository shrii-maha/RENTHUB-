import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Listing = mongoose.model('Listing', new mongoose.Schema({ title: String, status: String }));
    const listings = await Listing.find({});
    console.log(`Found ${listings.length} listings:`);
    listings.forEach(l => console.log(`- ${l.title} [${l.status}]`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
