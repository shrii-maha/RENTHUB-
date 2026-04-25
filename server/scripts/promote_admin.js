import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const TARGET_EMAIL = 'renthub.marketplace@gmail.com';

async function promote() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.model('User', new mongoose.Schema(
      { email: String, role: String, fullName: String },
      { strict: false }
    ));

    const result = await User.findOneAndUpdate(
      { email: TARGET_EMAIL },
      { $set: { role: 'admin' } },
      { new: true }
    );

    if (!result) {
      console.error(`❌ No user found with email: ${TARGET_EMAIL}`);
    } else {
      console.log(`✅ Successfully promoted ${result.email} (${result.fullName}) to role: ${result.role}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('💥 Error:', err.message);
    process.exit(1);
  }
}

promote();
