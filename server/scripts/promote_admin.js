import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function promote() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
    
    // Promote the requested email
    const email = 'srimantamaharana886@gmail.com';
    const result = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    
    if (result) {
      console.log(`✅ SUCCESS: ${email} is now an ADMIN.`);
    } else {
      console.log(`❌ FAILED: User ${email} not found in database.`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

promote();
