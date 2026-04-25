import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function swapAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
    
    // 1. Promote renthub.marketplace@gmail.com
    await User.findOneAndUpdate({ email: 'renthub.marketplace@gmail.com' }, { role: 'admin' });
    console.log('✅ renthub.marketplace@gmail.com promoted to ADMIN.');

    // 2. Demote srimantamaharana886@gmail.com
    await User.findOneAndUpdate({ email: 'srimantamaharana886@gmail.com' }, { role: 'user' });
    console.log('✅ srimantamaharana886@gmail.com demoted to USER.');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

swapAdmin();
