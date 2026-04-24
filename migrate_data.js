import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const listingSchema = new mongoose.Schema({}, { strict: false });
const Listing = mongoose.model('Listing', listingSchema);

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Find the target user (Admin/User)
    const targetUser = await User.findOne({ email: 'srimantamaharana886@gmail.com' });
    if (!targetUser) {
      console.error('Target user srimantamaharana886@gmail.com not found!');
      process.exit(1);
    }
    const targetId = targetUser._id.toString();
    console.log(`Target User: ${targetUser.email}, ID: ${targetId}`);

    // 2. Update listings with old email-based sellerId
    const oldEmails = ['renthub.marketplace@gmail.com', 'srimantamaharana886@gmail.com'];
    
    const result = await Listing.updateMany(
      { sellerId: { $in: oldEmails } },
      { $set: { sellerId: targetId } }
    );

    console.log(`Updated ${result.modifiedCount} listings to use ID ${targetId}`);

    // 3. Optional: Fix any other listings that use email as sellerId
    // We can iterate through all users and update their listings
    const allUsers = await User.find({});
    for (const u of allUsers) {
        const res = await Listing.updateMany(
            { sellerId: u.email },
            { $set: { sellerId: u._id.toString() } }
        );
        if (res.modifiedCount > 0) {
            console.log(`Updated ${res.modifiedCount} listings for ${u.email} to use ID ${u._id}`);
        }
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
