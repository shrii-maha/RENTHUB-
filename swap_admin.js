import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: String,
    fullName: String
}, { strict: false });
const User = mongoose.model('User', userSchema);

const listingSchema = new mongoose.Schema({
    sellerId: String
}, { strict: false });
const Listing = mongoose.model('Listing', listingSchema);

async function swapRoles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('1234', 10);

    // 1. Create or Update renthub.marketplace@gmail.com to Admin
    const adminUser = await User.findOneAndUpdate(
      { email: 'renthub.marketplace@gmail.com' },
      { 
        $set: { 
          role: 'admin',
          fullName: 'RentHub Admin',
          password: hashedPassword
        } 
      },
      { upsert: true, new: true }
    );
    console.log(`Admin User: ${adminUser.email} (ID: ${adminUser._id}) is now ADMIN.`);

    // 2. Update srimantamaharana886@gmail.com to normal user
    const normalUser = await User.findOneAndUpdate(
      { email: 'srimantamaharana886@gmail.com' },
      { $set: { role: 'user' } },
      { new: true }
    );
    if (normalUser) {
        console.log(`User: ${normalUser.email} (ID: ${normalUser._id}) is now a NORMAL USER.`);
    }

    // 3. Transfer ALL listings to the new Admin (renthub.marketplace)
    const result = await Listing.updateMany(
      {}, // Transfer everything to be safe as requested "all access"
      { $set: { sellerId: adminUser._id.toString() } }
    );
    console.log(`Transferred ${result.modifiedCount} listings to Admin ${adminUser.email}`);

    console.log('Role swap and data migration complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

swapRoles();
