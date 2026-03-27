import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import Listing from './models/Listing.js';
import ActivityLog from './models/ActivityLog.js';
import Order from './models/Order.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Multer config for image upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ─── ROUTES ────────────────────────────────────────────

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  console.log('📸 Image uploaded:', imageUrl);
  res.json({ url: imageUrl });
});

// Create Stripe Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents/paise
      currency: 'inr',
      payment_method_types: ['card', 'upi'],
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all active listings
app.get('/api/listings', async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.json(listings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single listing
app.get('/api/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create listing
app.post('/api/listings', async (req, res) => {
  try {
    const listing = new Listing(req.body);
    await listing.save();
    console.log('✅ New listing created:', listing.title);
    res.status(201).json(listing);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE listing
app.delete('/api/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    console.log('🗑️ Listing deleted:', listing.title);

    const activity = new ActivityLog({
      actionType: 'system',
      message: 'Listing Deleted',
      details: `${listing.title} was deleted`
    });
    await activity.save();

    res.json({ message: 'Listing deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ORDER ROUTES ──────────────────────────────────────────

// CREATE order
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();

    const activity = new ActivityLog({
      actionType: 'rental',
      message: 'New Transaction',
      details: `₹${order.amount.toLocaleString()} in escrow for listing ${order.listingId}`
    });
    await activity.save();

    console.log('💰 New Order placed in Escrow:', order._id);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── ADMIN ROUTES ──────────────────────────────────────

// GET admin stats
app.get('/api/admin/stats', async (_req, res) => {
  try {
    const listings = await Listing.find();
    
    // Calculate realistic earnings based on items
    const totalEarnings = listings.reduce((sum, item) => {
      const num = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
      // Mock platform fee: 5% of Sale, 15% of Rent
      return sum + (item.type === 'Sale' ? num * 0.05 : num * 0.15);
    }, 0);
    
    // Consider items without a status field as 'approved' (legacy)
    const activeListings = listings.filter(l => (l as any).status === 'approved' || !(l as any).status).length;
    const activeRents = listings.filter(l => ((l as any).status === 'approved' || !(l as any).status) && l.type === 'Rent').length;

    // Calculate Escrow Volume
    const escrowOrders = await Order.find({ status: 'escrow' });
    const totalEscrowVolume = escrowOrders.reduce((sum, o) => sum + o.amount, 0);

    res.json({ totalEarnings, activeListings, activeRents, totalEscrowVolume });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET all orders for Admin Ledger (Payouts & Revenue)
app.get('/api/admin/payouts', async (_req, res) => {
  try {
    const payouts = await Order.find({})
      .populate('listingId', 'title image type price category')
      .sort({ createdAt: -1 });
    res.json(payouts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET seller orders (for Earnings view)
app.get('/api/orders/seller/:email', async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.params.email })
      .populate('listingId', 'title image type price category')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET buyer orders (for My Purchases view)
app.get('/api/orders/buyer/:email', async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.params.email })
      .populate('listingId', 'title image type price category')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RELEASE single payout
app.patch('/api/admin/orders/:id/release', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'released' }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const activity = new ActivityLog({
      actionType: 'payout',
      message: 'Payout Released',
      details: `Released ₹${order.amount.toLocaleString()} to seller ${order.sellerId}`
    });
    await activity.save();

    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// RELEASE ALL payouts
app.post('/api/admin/orders/release-all', async (_req, res) => {
  try {
    const result = await Order.updateMany({ status: 'escrow' }, { status: 'released' });
    
    const activity = new ActivityLog({
      actionType: 'payout',
      message: 'Batch Payout Processed',
      details: `Released ${result.modifiedCount} platform batches successfully.`
    });
    await activity.save();

    res.json({ message: `Successfully released ${result.modifiedCount} payouts.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET pending approvals
app.get('/api/admin/pending', async (_req, res) => {
  try {
    const pending = await Listing.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update status
app.patch('/api/admin/listings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!listing) return res.status(404).json({ error: 'Not found' });

    const activity = new ActivityLog({
      actionType: status === 'approved' ? 'rental' : 'system',
      message: `Listing ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      details: `${listing.title} was ${status}`
    });
    await activity.save();

    res.json(listing);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET recent activity
app.get('/api/admin/activity', async (_req, res) => {
  try {
    const activities = await ActivityLog.find().sort({ createdAt: -1 }).limit(10);
    res.json(activities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET active sellers (Users Directory)
app.get('/api/admin/users', async (_req, res) => {
  try {
    const users = await Listing.aggregate([
      {
        $group: {
          _id: "$sellerId",
          totalListings: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          lastActive: { $max: "$updatedAt" }
        }
      },
      {
        $project: {
          email: "$_id",
          totalListings: 1,
          avgRating: { $round: ["$avgRating", 1] },
          lastActive: 1
        }
      },
      { $sort: { lastActive: -1 } }
    ]);
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update listing
app.put('/api/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Seed default listings if database is empty
app.post('/api/seed', async (_req, res) => {
  try {
    const count = await Listing.countDocuments();
    if (count > 0) {
      return res.json({ message: `Database already has ${count} listings. Skipping seed.` });
    }

    const defaultListings = [
      {
        title: "Modern Glass Villa",
        location: "Malibu, California",
        price: "₹9,80,00,000",
        type: "Sale",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2070",
        category: "Real Estate",
        sellerId: "admin",
      },
      {
        title: "Tesla Model S Plaid",
        location: "Miami, Florida",
        price: "₹74,50,000",
        type: "Sale",
        rating: 5.0,
        image: "https://images.unsplash.com/photo-1617788138017-80ad42243c59?auto=format&fit=crop&q=80&w=2070",
        category: "Vehicle",
        sellerId: "admin",
      },
      {
        title: "Rolex Submariner Date",
        location: "London, UK",
        price: "₹12,15,000",
        type: "Sale",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=2070",
        category: "Luxury Watches",
        sellerId: "admin",
      },
      {
        title: "Heavy Duty Excavator",
        location: "Berlin, Germany",
        price: "₹2,00,000",
        type: "Rent",
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1579412691511-2721b7155018?auto=format&fit=crop&q=80&w=2070",
        category: "Tools & Hardware",
        sellerId: "admin",
      },
      {
        title: "Designer Velvet Sofa",
        location: "Paris, France",
        price: "₹2,68,000",
        type: "Sale",
        rating: 5.0,
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2070",
        category: "Furniture",
        sellerId: "admin",
      },
      {
        title: "iPhone 15 Pro Max",
        location: "Tokyo, Japan",
        price: "₹1,59,900",
        type: "Sale",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=2070",
        category: "Electronics",
        sellerId: "admin",
      }
    ];

    await Listing.insertMany(defaultListings);
    res.json({ message: `✅ Seeded ${defaultListings.length} listings` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RentHub API running on http://localhost:${PORT}`);
});
