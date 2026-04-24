import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';
import Listing from './server/models/Listing.js';

dotenv.config();

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const adminEmail = 'renthub.marketplace@gmail.com';
  const admin = await User.findOne({ email: adminEmail });
  
  if (!admin) {
    console.log(`Admin user ${adminEmail} NOT FOUND!`);
  } else {
    console.log(`Admin User found: ${admin._id} (Role: ${admin.role})`);
    
    // Count listings owned by this admin
    const listingsCount = await Listing.countDocuments({ sellerId: admin._id });
    console.log(`Listings owned by Admin (${admin._id}): ${listingsCount}`);

    // If 0, let's see if there are any listings with NO sellerId or old email-based sellerId
    const totalListings = await Listing.countDocuments();
    console.log(`Total Listings in DB: ${totalListings}`);
    
    const unownedListings = await Listing.find({ sellerId: { $exists: false } });
    console.log(`Listings with NO sellerId: ${unownedListings.length}`);

    // Check if any listings still use email as sellerId (legacy)
    const emailOwnedListings = await Listing.find({ sellerId: { $type: "string" } });
    const count = emailOwnedListings.filter(l => l.sellerId.includes('@')).length;
    console.log(`Listings with EMAIL-based sellerId: ${count}`);

    // Migration logic if needed
    if (count > 0 || totalListings > listingsCount) {
        console.log("Migration needed. Moving all listings to the Admin account as requested...");
        await Listing.updateMany({}, { $set: { sellerId: admin._id } });
        console.log("Migration complete. All listings are now owned by the Admin account.");
    }
  }

  // Check srimantamaharana886@gmail.com
  const userEmail = 'srimantamaharana886@gmail.com';
  const user = await User.findOne({ email: userEmail });
  if (user) {
    console.log(`User found: ${userEmail} (Role: ${user.role})`);
    if (user.role !== 'user') {
        user.role = 'user';
        await user.save();
        console.log(`Updated ${userEmail} to role: user`);
    }
  }

  await mongoose.disconnect();
}

checkData();
