import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const ADMIN_EMAIL  = 'renthub.marketplace@gmail.com';

async function fixRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.model('User', new mongoose.Schema(
      { email: String, role: String, fullName: String },
      { strict: false }
    ));

    // 1. Set ALL users to 'user' role first
    const demoteResult = await User.updateMany(
      { email: { $ne: ADMIN_EMAIL } },
      { $set: { role: 'user' } }
    );
    console.log(`✅ Demoted ${demoteResult.modifiedCount} non-admin accounts to role: user`);

    // 2. Promote only the target email to admin
    const adminResult = await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      { $set: { role: 'admin' } },
      { returnDocument: 'after' }
    );

    if (!adminResult) {
      console.error(`❌ No user found with email: ${ADMIN_EMAIL}`);
    } else {
      console.log(`✅ ${adminResult.email} (${adminResult.fullName}) → role: ${adminResult.role}`);
    }

    // 3. Print final state
    const all = await User.find({});
    console.log('\n📋 Final user roles:');
    all.forEach(u => console.log(`  - ${u.email} [${u.role}]`));

    process.exit(0);
  } catch (err) {
    console.error('💥 Error:', err.message);
    process.exit(1);
  }
}

fixRoles();
