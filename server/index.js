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
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { GoogleGenAI } from "@google/genai";
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

// Models
import Listing from './models/Listing.js';
import ActivityLog from './models/ActivityLog.js';
import Order from './models/Order.js';
import User from './models/User.js';
import Review from './models/Review.js';
import ChatSession from './models/ChatSession.js';
import ChatMessage from './models/ChatMessage.js';
import Notification from './models/Notification.js';

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const genAI = process.env.GOOGLE_GENAI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }) : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { error: 'Daily AI limit reached. Please try again tomorrow.' }
});

// Auth Middleware
const verifyToken = (req, res, next) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ CRITICAL ERROR: JWT_SECRET is not defined in .env');
    return res.status(500).json({ error: 'Server configuration error.' });
  }
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) { res.status(400).json({ error: 'Invalid token.' }); }
};

// JWT Generator
const generateJWT = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email, role: user.role, fullName: user.fullName, avatar: user.avatar },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

// Passport Setup
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({ fullName: profile.displayName || 'Google User', email, avatar: profile.photos?.[0]?.value || '' });
        await user.save();
      }
      return done(null, user);
    } catch (err) { return done(err); }
  }));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({ fullName: profile.displayName || profile.username || 'GitHub User', email, avatar: profile.photos?.[0]?.value || '' });
        await user.save();
      }
      return done(null, user);
    } catch (err) { return done(err); }
  }));
}

// OAuth Routes
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
app.get('/api/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const token = generateJWT(req.user);
  res.redirect(`${FRONTEND_URL}/?token=${token}`);
});

app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
app.get('/api/auth/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
  const token = generateJWT(req.user);
  res.redirect(`${FRONTEND_URL}/?token=${token}`);
});

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helpers
const getCoordinates = async (location) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`);
    const data = await res.json();
    if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err) { console.error('Geocoding failed:', err); }
  return null;
};

// --- API ROUTES ---

// Auth
app.post('/api/auth/register', 
  authLimiter,
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
      const { fullName, email, password } = req.body;
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ error: 'User already exists' });
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ fullName, email, password: hashedPassword });
      await user.save();
      const token = generateJWT(user);
      res.status(201).json({ token, user: { _id: user._id, email: user.email, fullName: user.fullName, role: user.role } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', 
  authLimiter,
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
      const token = generateJWT(user);
      res.json({ token, user: { _id: user._id, email: user.email, fullName: user.fullName, role: user.role } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const { fullName, phone, bio, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, phone, bio, address },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/avatar', verifyToken, async (req, res) => {
  // This would typically use multer + cloudinary, for now we accept a URL
  try {
    const { avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Listings
app.post('/api/listings', verifyToken, async (req, res) => {
  try {
    const listingData = { ...req.body, status: 'pending', sellerId: req.user.email };
    const coords = await getCoordinates(req.body.location);
    if (coords) { listingData.lat = coords.lat; listingData.lng = coords.lng; }
    const listing = new Listing(listingData);
    await listing.save();
    await ActivityLog.create({ actionType: 'system', message: 'New Product Listed', details: `${listing.title} is pending approval` });
    res.status(201).json(listing);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/listings', async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/listings/seller/:id', verifyToken, async (req, res) => {
  try {
    const listings = await Listing.find({ sellerId: req.params.id }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Notifications
app.get('/api/notifications/:email', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.email }).sort({ createdAt: -1 }).limit(30);
    res.json(notifications);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Orders
app.post('/api/orders', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = new Order(req.body);
    await order.save({ session });

    const listing = await Listing.findById(order.listingId).session(session);
    if (!listing) throw new Error('Listing not found');
    
    listing.status = listing.type === 'Sale' ? 'sold' : 'rented';
    await listing.save({ session });

    await Notification.create([{ 
      userId: order.sellerId, 
      type: 'order_placed', 
      message: `New order for "${listing.title}". ₹${order.amount.toLocaleString()} in escrow.` 
    }], { session });

    await session.commitTransaction();
    res.status(201).json(order);
  } catch (err) { 
    await session.abortTransaction();
    res.status(400).json({ error: err.message }); 
  } finally {
    session.endSession();
  }
});

app.patch('/api/orders/:id/ship', verifyToken, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'shipped', ...req.body }, { new: true });
    await Notification.create({ userId: order.buyerId, type: 'order_shipped', message: `Your order has been shipped!` });
    res.json(order);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.patch('/api/orders/:id/confirm-delivery', verifyToken, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'released' }, { new: true });
    await Notification.create({ userId: order.sellerId, type: 'order_delivered', message: `Buyer confirmed delivery! Funds released.` });
    res.json(order);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/orders/seller/:email', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.params.email }).populate('listingId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/orders/buyer/:email', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.params.email }).populate('listingId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin
app.get('/api/admin/stats', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
  try {
    const totalListings = await Listing.countDocuments();
    const pendingApprovals = await Listing.countDocuments({ status: 'pending' });
    const totalOrders = await Order.countDocuments();
    const totalEarnings = (await Order.find({ status: 'released' })).reduce((s, o) => s + o.amount, 0);
    res.json({ totalListings, pendingApprovals, totalOrders, totalEarnings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/pending', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
  try {
    const pending = await Listing.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/listings/:id/status', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
  try {
    const { status } = req.body;
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (status === 'approved') {
      await Notification.create({ userId: listing.sellerId, type: 'listing_approved', message: `Your listing "${listing.title}" is now LIVE!` });
    }
    res.json(listing);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Chat
app.post('/api/chat/sessions', verifyToken, async (req, res) => {
  try {
    const { sellerId, listingId } = req.body;
    let session = await ChatSession.findOne({ participants: { $all: [req.user.email, sellerId] }, listingId });
    if (!session) { session = new ChatSession({ participants: [req.user.email, sellerId], listingId }); await session.save(); }
    res.json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/chat/sessions/:email', verifyToken, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ participants: req.params.email }).sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/chat/messages/:sessionId', verifyToken, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ sessionId: req.params.sessionId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/chat/messages', verifyToken, async (req, res) => {
  try {
    const message = new ChatMessage({ ...req.body, senderId: req.user.email });
    await message.save();
    await ChatSession.findByIdAndUpdate(req.body.sessionId, { lastMessage: req.body.text, lastMessageAt: Date.now() });
    res.status(201).json(message);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Chat
app.post('/api/chat', aiLimiter, async (req, res) => {
  if (!genAI) return res.status(500).json({ error: 'AI not configured' });
  try {
    const { message } = req.body;
    const model = genAI.models.get('gemini-1.5-flash');
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: message }] }] });
    res.json({ text: result.response.text() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Server Start
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB error:', err));
});
