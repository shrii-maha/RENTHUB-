/**
 * seed-listings.ts
 * Run with: npx tsx server/scripts/seed-listings.ts
 * Inserts 12 premium sample listings into MongoDB for demo/presentation.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Listing from '../models/Listing.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;

const sampleListings = [
  {
    title: 'Luxury Sea-View Villa — Goa',
    description: 'A stunning 4BHK sea-facing villa with infinity pool, private beach access, and fully-equipped kitchen. Perfect for family holidays or corporate retreats. Includes 24/7 caretaker service.',
    price: '₹25,000/night',
    category: 'Real Estate',
    type: 'Rent',
    location: 'Calangute, Goa',
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Excellent',
    available: true,
  },
  {
    title: 'Mercedes-Benz GLE 450 — SUV',
    description: 'Premium luxury SUV in mint condition. Full service history, sunroof, Burmester sound system, and MBUX infotainment. Ideal for long drives and corporate travel.',
    price: '₹4,200/day',
    category: 'Vehicle',
    type: 'Rent',
    location: 'Mumbai, Maharashtra',
    image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Like New',
    available: true,
  },
  {
    title: 'Sony A7 IV Full-Frame Camera Kit',
    description: 'Professional mirrorless camera with 33MP sensor. Package includes 28-70mm lens, extra batteries, 128GB CFexpress card, and carrying case. Perfect for events and shoots.',
    price: '₹2,800/day',
    category: 'Electronics',
    type: 'Rent',
    location: 'Bangalore, Karnataka',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Excellent',
    available: true,
  },
  {
    title: 'MacBook Pro M3 Pro — 16"',
    description: 'Apple MacBook Pro with M3 Pro chip, 18GB RAM, 512GB SSD. Perfect for video editing, software development, and creative work. Comes with original charger and sleeve.',
    price: '₹89,990',
    category: 'Electronics',
    type: 'Sale',
    location: 'Delhi, NCR',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Like New',
    available: true,
  },
  {
    title: 'Royal Enfield Thunderbird 500 — 2022',
    description: 'Well-maintained Royal Enfield Thunderbird 500cc. Single owner, 12,000 km driven. Includes crash guard, saddlebags, and windshield. All papers clear.',
    price: '₹1,65,000',
    category: 'Vehicle',
    type: 'Sale',
    location: 'Pune, Maharashtra',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Good',
    available: true,
  },
  {
    title: 'DJI Mavic 3 Pro Drone',
    description: 'Professional drone with Hasselblad camera, 43-min flight time, and 15km range. Includes 3 batteries, ND filters, carrying bag, and extra props. Ideal for aerial photography.',
    price: '₹3,500/day',
    category: 'Electronics',
    type: 'Rent',
    location: 'Hyderabad, Telangana',
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Excellent',
    available: true,
  },
  {
    title: 'Designer Office Chair — Herman Miller Aeron',
    description: 'Iconic ergonomic office chair in perfect condition. Fully adjustable lumbar support, mesh back, and tilt mechanism. Retail price ₹1.2L — selling at a fraction of cost.',
    price: '₹45,000',
    category: 'Furniture',
    type: 'Sale',
    location: 'Chennai, Tamil Nadu',
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Good',
    available: true,
  },
  {
    title: 'Nikon Z6 II Mirrorless Camera',
    description: 'Full-frame mirrorless with dual card slots and 4K video. Package includes 50mm f/1.8 lens, 2 batteries, charger, and a 256GB XQD card. Great for weddings and portraits.',
    price: '₹58,000',
    category: 'Electronics',
    type: 'Sale',
    location: 'Kolkata, West Bengal',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Excellent',
    available: true,
  },
  {
    title: 'Premium Tent & Camping Kit',
    description: '6-person waterproof tent with sleeping bags, cooking stove, lanterns, and all camping essentials. Perfect for Himachal or Uttarakhand treks. Weekend rentals available.',
    price: '₹1,200/day',
    category: 'Sports & Outdoors',
    type: 'Rent',
    location: 'Manali, Himachal Pradesh',
    image: 'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Good',
    available: true,
  },
  {
    title: 'Yamaha Grand Piano — P-125',
    description: 'Portable grand piano with 88 weighted keys and built-in speakers. Ideal for music schools and performances. Comes with sustain pedal, stand, and bench.',
    price: '₹800/day',
    category: 'Musical Instruments',
    type: 'Rent',
    location: 'Jaipur, Rajasthan',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Excellent',
    available: true,
  },
  {
    title: 'iPhone 15 Pro Max — 256GB Natural Titanium',
    description: '1 month old iPhone 15 Pro Max. Includes original box, 2 cases, cable, and Apple Care+ till 2026. Selling due to upgrade. No scratches or dents.',
    price: '₹1,24,000',
    category: 'Electronics',
    type: 'Sale',
    location: 'Ahmedabad, Gujarat',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Like New',
    available: true,
  },
  {
    title: 'Luxury Houseboat Stay — Dal Lake',
    description: 'Authentic Kashmiri houseboat on the serene Dal Lake. Includes 2 bedrooms, attached bathrooms, and daily shikara rides. Breakfast and dinner included in the package.',
    price: '₹8,500/night',
    category: 'Real Estate',
    type: 'Rent',
    location: 'Srinagar, Kashmir',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop'],
    sellerId: 'renthub.marketplace@gmail.com',
    status: 'approved',
    condition: 'Excellent',
    available: true,
  },
];

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas');

  // Clear existing listings
  const existing = await Listing.countDocuments({ sellerId: 'renthub.marketplace@gmail.com', status: 'approved' });
  if (existing > 0) {
    console.log(`ℹ️  Found ${existing} existing demo listings. Skipping seed to avoid duplicates.`);
    console.log('   (Delete existing listings from Atlas if you want to re-seed.)');
    await mongoose.disconnect();
    return;
  }

  console.log('📦 Inserting 12 premium sample listings...');
  await Listing.insertMany(sampleListings);
  console.log('✅ 12 listings seeded successfully!');
  console.log('🎉 Your marketplace is now populated and ready for the presentation!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
