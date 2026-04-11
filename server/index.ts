import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Listing from './models/Listing.js';
import ActivityLog from './models/ActivityLog.js';
import Order from './models/Order.js';
import User from './models/User.js';
import Review from './models/Review.js';
import { GoogleGenAI } from "@google/genai";
import ChatSession from './models/ChatSession.js';
import ChatMessage from './models/ChatMessage.js';

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
if (!stripe) {
  console.warn('⚠️ STRIPE_SECRET_KEY is missing. Payment features will be disabled.');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust for production security if needed
    methods: ["GET", "POST"]
  }
});
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

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'renthub',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif']
  } as any
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/renthub';
if (!process.env.MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI is at default (localhost). Ensure local MongoDB is running.');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ─── DIAGNOSTICS & HEALTH ────────────────────────────
app.get('/', (_req, res) => {
  res.send('🚀 RentHub API is Live and Operational.');
});

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    socket: io.engine.clientsCount
  });
});

// ─── SOCKET.IO CHAT LOGIC ────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 New Client Connected:', socket.id);

  socket.on('join_session', (sessionId) => {
    socket.join(sessionId);
    console.log(`👤 User joined session: ${sessionId}`);
  });

  socket.on('send_message', async (data) => {
    const { sessionId, senderId, text } = data;
    try {
      // Save message to DB
      const message = new ChatMessage({ sessionId, senderId, text });
      await message.save();

      // Update session last message
      await ChatSession.findByIdAndUpdate(sessionId, {
        lastMessage: text,
        lastMessageAt: new Date()
      });

      // Broadcast to everyone in the room (including sender)
      io.to(sessionId).emit('new_message', message);
    } catch (err) {
      console.error('❌ Socket Message Error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client Disconnected');
  });
});

// ─── ROUTES ────────────────────────────────────────────

// Upload image with robust error handling
app.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Upload Middleware Error:', err);
      // Handle Multer errors (file size limits, etc)
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      // Handle Cloudinary configuration or connection errors
      return res.status(500).json({ 
        error: "Cloudinary storage failed. Please ensure CLOUDINARY_ environment variables are correctly set in the dashboard.",
        details: err.message 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file selected for upload.' });
    }

    const imageUrl = req.file.path;
    console.log('📸 Asset synced to Cloudinary:', imageUrl);
    res.json({ url: imageUrl });
  });
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

// GET all active listings (public)
app.get('/api/listings', async (req, res) => {
  try {
    // Only return approved listings that are NOT sold or rented
    const listings = await Listing.find({ status: 'approved' }).sort({ createdAt: -1 }).lean();
    
    // Enrich with seller stats
    const enriched = await Promise.all(listings.map(async (item) => {
      const email = item.sellerId;
      const reviews = await Review.find({ sellerId: email });
      const totalReviews = reviews.length;
      const avgRating = totalReviews > 0 
        ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) * 10) / 10 
        : 0;

      const salesCount = await Order.countDocuments({ 
        sellerId: email, 
        status: { $in: ['delivered', 'released', 'paid'] } 
      });

      return {
        ...item,
        sellerStats: {
          avgRating,
          totalReviews,
          salesCount,
          isVerified: salesCount >= 5 && avgRating >= 4.0
        }
      };
    }));

    res.json(enriched);
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
    console.log('📦 Listing Attempt:', req.body.title);
    
    // Remove 'id' if it exists to let Mongoose generate '_id'
    const listingData = { ...req.body };
    delete listingData.id;

    console.log('⏳ Saving Listing to Database...');
    const listing = new Listing(listingData);
    
    // Ensure legacy 'image' field is set if 'images' array exists
    if (listing.images && listing.images.length > 0 && !listing.image) {
      listing.image = listing.images[0];
    }
    
    await listing.save();
    console.log('✅ Listing Saved Successfully:', listing._id);
    
    // Log new listing to ActivityLog (Non-blocking preferably, but wrapped in try/catch)
    try {
      console.log('⏳ Creating Activity Log...');
      const activity = new ActivityLog({
        actionType: 'system',
        message: 'New Product Listed',
        details: `${listing.title} is pending approval from ${listing.sellerId}`
      });
      await activity.save();
      console.log('✅ Activity Log Saved.');
    } catch (logErr: any) {
      console.warn('⚠️ Activity Log failed (non-critical):', logErr.message);
    }
    
    res.status(201).json(listing);
  } catch (err: any) {
    console.error('❌ Listing Creation Failed:', err.message);
    res.status(400).json({ error: `Database Error: ${err.message}` });
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

// GET seller listings (for Dashboard)
app.get('/api/listings/seller/:id', async (req, res) => {
  try {
    const listings = await Listing.find({ sellerId: req.params.id }).sort({ createdAt: -1 });
    res.json(listings);
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

    // UPDATE Listing Status
    const listing = await Listing.findById(order.listingId);
    if (listing) {
      listing.status = listing.type === 'Sale' ? 'sold' : 'rented';
      await listing.save();
      console.log(`🏷️ Listing ${listing.title} status updated to ${listing.status}`);
    }

    const activity = new ActivityLog({
      actionType: 'rental',
      message: 'New Transaction',
      details: `₹${order.amount.toLocaleString()} in escrow for listing ${listing ? listing.title : order.listingId}`
    });
    await activity.save();

    console.log('💰 New Order placed in Escrow:', order._id);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// SELLER: Mark order as shipped
app.patch('/api/orders/:id/ship', async (req, res) => {
  try {
    const { trackingNumber, shippingNote, deliveryMethod } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'escrow') return res.status(400).json({ error: 'Order is not in escrow state' });

    order.status = 'shipped';
    order.trackingNumber = trackingNumber || '';
    order.shippingNote = shippingNote || '';
    order.deliveryMethod = deliveryMethod || 'shipping';
    await order.save();

    console.log(`🚚 Order ${order._id} marked as shipped`);
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// BUYER: Confirm delivery → release escrow to seller
app.patch('/api/orders/:id/confirm-delivery', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['escrow', 'shipped'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be confirmed at this stage' });
    }

    order.status = 'released';
    await order.save();

    const activity = new ActivityLog({
      actionType: 'approval',
      message: 'Escrow Released',
      details: `Buyer confirmed delivery — escrow released for order ${order._id}`
    });
    await activity.save();

    console.log(`✅ Escrow released for order ${order._id}`);
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
    
    // Active listings are ONLY those that are approved (and not sold/rented)
    const activeListings = listings.filter(l => (l as any).status === 'approved').length;
    // Active rents are ONLY those that are approved AND type'Rent'
    const activeRents = listings.filter(l => (l as any).status === 'approved' && l.type === 'Rent').length;

    // Calculate Escrow Volume
    const escrowOrders = await Order.find({ status: 'escrow' });
    const totalEscrowVolume = escrowOrders.reduce((sum, o) => sum + o.amount, 0);

    res.json({ totalEarnings, activeListings, activeRents, totalEscrowVolume });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI CHAT ASSISTANT ──────────────────────────────────────
const genAI = process.env.GOOGLE_GENAI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }) : null;

app.post('/api/chat', async (req, res) => {
  if (!genAI) {
    return res.status(500).json({ error: "AI Chat is not configured. Please add GOOGLE_GENAI_API_KEY to your Render environment variables." });
  }

  try {
    const { message, history } = req.body;

    // Fetch live marketplace context
    const listings = await Listing.find({ status: 'approved' }).limit(10);
    const marketplaceContext = listings.map(l => `${l.title} (${l.type}) for ${l.price} in ${l.location}`).join(', ');

    // Build conversation history as a single prompt
    let fullPrompt = `You are "RentHub AI", a premium marketplace assistant.
Platform: RentHub is a marketplace for buying, selling, and renting premium items.
Current Live Listings: ${marketplaceContext}.
Personality: Professional, helpful, and concise. Use **bold** for key terms.
Goal: Help users find products, explain platform features, give suggestions.

`;

    if (history && history.length > 0) {
      history.forEach((h: any) => {
        fullPrompt += `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}\n`;
      });
    }
    fullPrompt += `User: ${message}\nAssistant:`;

    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: fullPrompt,
    });

    const text = response.text;
    res.json({ text });
  } catch (err: any) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ error: "I'm having trouble right now. Please try again in a moment." });
  }
});

// GET all listings for Admin Management (Live + Sold + Rented)
app.get('/api/admin/listings', async (_req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.json(listings);
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

// REQUEST withdrawal from seller
app.post('/api/payouts/request/:email', async (req, res) => {
  try {
    const result = await Order.updateMany(
      { sellerId: req.params.email, status: 'released' },
      { status: 'payout_requested' }
    );
    
    if (result.modifiedCount > 0) {
      const activity = new ActivityLog({
        actionType: 'payout',
        message: 'Withdrawal Requested',
        details: `Seller ${req.params.email} requested payout for ${result.modifiedCount} items.`
      });
      await activity.save();
    }
    
    res.json({ message: `Successfully requested payout for ${result.modifiedCount} items.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DISBURSE payout from admin
app.patch('/api/admin/payouts/disburse/:sellerId', async (req, res) => {
  try {
    const result = await Order.updateMany(
      { sellerId: req.params.sellerId, status: 'payout_requested' },
      { status: 'paid' }
    );
    
    const activity = new ActivityLog({
      actionType: 'payout',
      message: 'Payout Disbursed',
      details: `Completed payment of ${result.modifiedCount} items to seller ${req.params.sellerId}`
    });
    await activity.save();
    
    res.json({ message: `✅ Successfully disbursed ${result.modifiedCount} payouts.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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

// POST sync user data
app.post('/api/users/sync', async (req, res) => {
  try {
    const { clerkId, email, fullName } = req.body;
    if (!clerkId || !email) return res.status(400).json({ error: "Missing required fields" });

    let user = await User.findOne({ clerkId });
    if (user) {
      user.email = email;
      user.fullName = fullName || user.fullName;
      user.lastActiveAt = new Date();
      await user.save();
    } else {
      user = new User({ clerkId, email, fullName: fullName || email.split('@')[0], lastActiveAt: new Date() });
      await user.save();
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── RATING & REVIEW ROUTES ──────────────────────────

// POST create a review
app.post('/api/reviews', async (req, res) => {
  try {
    const { orderId, listingId, buyerId, sellerId, rating, comment } = req.body;

    // 1. Verify order exists and is eligible for review
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (!['delivered', 'released', 'paid'].includes(order.status)) {
      return res.status(400).json({ error: "Order must be delivered before reviewing" });
    }

    // 2. Check for duplicate review
    const existing = await Review.findOne({ orderId });
    if (existing) return res.status(400).json({ error: "Review already exists for this order" });

    // 3. Save the review
    const review = new Review({ orderId, listingId, buyerId, sellerId, rating, comment });
    await review.save();

    // 4. Update Listing Average Rating
    const reviews = await Review.find({ listingId });
    const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
    
    await Listing.findByIdAndUpdate(listingId, { 
      rating: Math.round(avgRating * 10) / 10 
    });

    const activity = new ActivityLog({
      actionType: 'rental',
      message: 'New Review Received',
      details: `Buyer left a ${rating}-star review for order ${orderId}`
    });
    await activity.save();

    res.status(201).json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET reviews for a listing
app.get('/api/reviews/listing/:id', async (req, res) => {
  try {
    const reviews = await Review.find({ listingId: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET reviews for a seller
app.get('/api/reviews/seller/:email', async (req, res) => {
  try {
    const reviews = await Review.find({ sellerId: req.params.email }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET seller reputation profile
app.get('/api/seller/profile/:email', async (req, res) => {
  try {
    const email = req.params.email;
    
    // 1. Aggregate reviews
    const reviews = await Review.find({ sellerId: email });
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) * 10) / 10 
      : 0;

    // 2. Count successful sales (delivered/released/paid)
    const salesCount = await Order.countDocuments({ 
      sellerId: email, 
      status: { $in: ['delivered', 'released', 'paid'] } 
    });

    // 3. Verification Logic
    const isVerified = salesCount >= 5 && avgRating >= 4.0;

    res.json({
      avgRating,
      totalReviews,
      salesCount,
      isVerified,
      joinedDate: '2024-01-01' // Placeholder for now, can be extracted from first listing if needed
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET active sellers (Users Directory)
app.get('/api/admin/users', async (_req, res) => {
  try {
    // 1. Get listing counts per seller
    const listingStats = await Listing.aggregate([
      { $group: { _id: "$sellerId", totalListings: { $sum: 1 } } }
    ]);

    // 2. Get ACTUAL average ratings from Reviews
    const reviewStats = await Review.aggregate([
      { $group: { _id: "$sellerId", avgRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
    ]);

    const realUsers = await User.find().lean();
    
    // 3. Merge all data sources
    const mergedUsers = realUsers.map(u => {
      const lStats = listingStats.find(s => s._id === u.clerkId || s._id === u.email);
      const rStats = reviewStats.find(r => r._id === u.clerkId || r._id === u.email);
      
      return {
        _id: u._id,
        email: u.email,
        fullName: u.fullName,
        clerkId: u.clerkId,
        lastActive: u.lastActiveAt,
        totalListings: lStats ? lStats.totalListings : 0,
        avgRating: rStats ? Math.round(rStats.avgRating * 10) / 10 : null,
        totalReviews: rStats ? rStats.totalReviews : 0
      };
    });

    // Add sellers that might not be in the 'User' model yet (legacy or admin items)
    listingStats.forEach(stats => {
      const exists = mergedUsers.find(u => u.clerkId === stats._id || u.email === stats._id);
      if (!exists) {
        const rStats = reviewStats.find(r => r._id === stats._id);
        mergedUsers.push({
          _id: stats._id,
          email: stats._id,
          fullName: stats._id.includes('@') ? stats._id.split('@')[0] : stats._id,
          clerkId: stats._id,
          lastActive: null,
          totalListings: stats.totalListings,
          avgRating: rStats ? Math.round(rStats.avgRating * 10) / 10 : null,
          totalReviews: rStats ? rStats.totalReviews : 0
        });
      }
    });

    mergedUsers.sort((a, b) => {
       if (a.lastActive && b.lastActive) return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    
    // Log Administrative Edit
    const activity = new ActivityLog({
      actionType: 'system',
      message: 'Product Updated',
      details: `${listing.title} was updated by administrator.`
    });
    await activity.save();
    
    console.log('📝 Listing updated:', listing.title);
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
        status: "approved",
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
        status: "approved",
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
        status: "approved",
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
        status: "approved",
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
        status: "approved",
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
        status: "approved",
        sellerId: "admin",
      }
    ];

    await Listing.insertMany(defaultListings);
    res.json({ message: `✅ Seeded ${defaultListings.length} listings` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// One-time repair for image paths (Add leading slash to uploads/...)
app.post('/api/admin/repair-paths', async (_req, res) => {
  try {
    const listings = await Listing.find({ image: { $regex: /^uploads\// } });
    let count = 0;
    for (const listing of listings) {
      listing.image = '/' + listing.image;
      await listing.save();
      count++;
    }
    res.json({ message: `✅ Repaired ${count} listing image paths.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 RentHub API & Real-time Server running on port ${PORT}`);
});
