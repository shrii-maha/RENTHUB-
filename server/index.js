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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dotenvResult = dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (dotenvResult.error) {
  if (process.env.NODE_ENV === 'production') {
    console.log('ℹ️ No .env file found; using environment variables from host dashboard.');
  } else {
    console.warn('⚠️ No .env file found. Local development may require it.');
  }
} else {
  console.log('✅ .env loaded successfully.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const genAI = process.env.GOOGLE_GENAI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }) : null;

// Nodemailer Config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.set('trust proxy', 1); // Trust Render/Vercel proxy for secure cookies and redirect URIs

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
    { _id: user._id.toString(), email: user.email, role: user.role, fullName: user.fullName, avatar: user.avatar },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

// Payments
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!stripe) {
      console.error('❌ Stripe is not configured (missing STRIPE_SECRET_KEY)');
      return res.status(500).json({ error: 'Payment gateway is not configured on the server.' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents/paisa
      currency: 'inr',
      metadata: { integration_check: 'accept_a_payment' },
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('💥 Stripe Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

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

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
app.get('/api/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const token = generateJWT(req.user);
  console.log(`🚀 Google Login: ${req.user.email} | Redirecting to: ${FRONTEND_URL}`);
  res.redirect(`${FRONTEND_URL}/?token=${token}`);
});

app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
app.get('/api/auth/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
  const token = generateJWT(req.user);
  console.log(`🚀 GitHub Login: ${req.user.email} | Redirecting to: ${FRONTEND_URL}`);
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
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`, {
      headers: { 'User-Agent': 'RentHub-Marketplace/1.0' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err) { console.error('Geocoding failed:', err); }
  return null;
};

const generateInvoiceNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RH-INV-${date}-${random}`;
};

// --- API ROUTES ---
app.get('/api/auth/me', verifyToken, async (req, res) => {
  console.log('📡 GET /api/auth/me - User ID:', req.user?._id);
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log(`👤 User Verified: ${user.email} | Role: ${user.role}`);
    res.json(user);
  } catch (err) { 
    console.error('💥 /api/auth/me error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/auth/avatar', verifyToken, multer({ storage: new CloudinaryStorage({ cloudinary, params: { folder: 'avatars' } }) }).single('avatar'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: req.file.path }, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
});



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
      
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      user = new User({ 
        fullName, 
        email, 
        password: hashedPassword,
        verificationToken,
        isVerified: false 
      });
      await user.save();

      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?verify_token=${verificationToken}`;
      
      await transporter.sendMail({
        from: `"RentHub Marketplace" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Verify Your RentHub Account",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #000;">Welcome to RentHub!</h2>
            <p>Please click the button below to verify your email address and activate your account.</p>
            <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Verify Account</a>
            <p style="color: #666; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `
      });

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
      if (user.password && !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      const token = generateJWT(user);
      res.json({ token, user: { _id: user._id, email: user.email, fullName: user.fullName, role: user.role } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?reset_token=${resetToken}`;
    
    await transporter.sendMail({
      from: `"RentHub Marketplace" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #000;">Password Reset Request</h2>
          <p>You requested a password reset for your RentHub account.</p>
          <p>Please click the button below to set a new password. This link will expire in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Reset Password</a>
          <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'Reset link sent to your email.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ 
      resetToken: token, 
      resetTokenExpiry: { $gt: Date.now() } 
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ error: 'Invalid verification token' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Account verified successfully! You can now use all features.' });
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
    await Notification.create({ userId: req.user._id, type: 'profile_updated', message: 'Your profile has been updated successfully.' });
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
    const listingData = { ...req.body, status: 'pending', sellerId: req.user._id };
    const coords = await getCoordinates(req.body.location);
    if (coords) { listingData.lat = coords.lat; listingData.lng = coords.lng; }
    const listing = new Listing(listingData);
    await listing.save();
    await ActivityLog.create({ actionType: 'system', message: 'New Product Listed', details: `${listing.title} is pending approval` });
    await Notification.create({ userId: req.user._id, type: 'listing_created', message: `Your listing "${listing.title}" has been submitted and is pending approval.` });
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

app.put('/api/listings/:id', verifyToken, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    
    // Authorization: Only seller or admin can update
    if (listing.sellerId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // When a seller updates, reset status to pending for re-approval
    // and reset promotion to avoid abuse
    const updateData = { ...req.body, status: 'pending', isPromoted: false };
    const updated = await Listing.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    await ActivityLog.create({ actionType: 'system', message: 'Listing Updated', details: `"${listing.title}" edited and pending re-approval.` });
    await Notification.create({ userId: req.user._id, type: 'listing_updated', message: `Your listing "${listing.title}" has been updated and is pending re-approval.` });
    
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/listings/seller/:id', verifyToken, async (req, res) => {
  try {
    const listings = await Listing.find({ sellerId: req.params.id }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Notifications
app.get('/api/notifications/:userId', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notification);
  } catch (err) { res.status(400).json({ error: err.message }); }
});


app.delete('/api/listings/:id', verifyToken, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.sellerId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Listing.findByIdAndDelete(req.params.id);
    await ActivityLog.create({ actionType: 'system', message: 'Listing Deleted', details: `Listing ${listing.title} was removed by ${req.user.fullName}` });
    await Notification.create({ userId: req.user._id, type: 'listing_deleted', message: `Your listing "${listing.title}" was deleted successfully.` });
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/listings/:id/promote', verifyToken, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.sellerId !== req.user._id) {
      return res.status(403).json({ error: 'Only the seller can promote their listing' });
    }

    listing.isPromoted = !listing.isPromoted;
    await listing.save();
    
    if (listing.isPromoted) {
      await ActivityLog.create({ actionType: 'payout', message: 'Asset Promoted', details: `"${listing.title}" boosted to front page.` });
    }
    
    res.json(listing);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Notifications
app.get('/api/notifications/:id', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(30);
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
    const orderData = { ...req.body, invoiceNumber: generateInvoiceNumber() };
    const order = new Order(orderData);
    await order.save({ session });

    const listing = await Listing.findById(order.listingId).session(session);
    if (!listing) throw new Error('Listing not found');
    
    listing.status = listing.type === 'Sale' ? 'sold' : 'rented';
    await listing.save({ session });

    const seller = await User.findById(order.sellerId).session(session);
    const sellerEmail = seller?.email || order.sellerId;

    await Notification.create([{ 
      userId: order.sellerId, 
      type: 'order_placed', 
      message: `New order for "${listing.title}". ₹${order.amount.toLocaleString()} in escrow.` 
    }, {
      userId: order.buyerId,
      type: 'order_placed',
      message: `Your order for "${listing.title}" was placed successfully.`
    }], { session });

    // Send Email to Buyer
    await transporter.sendMail({
      from: `"RentHub Marketplace" <${process.env.EMAIL_USER}>`,
      to: order.buyerId,
      subject: `Order Confirmed: ${listing.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #000;">Order Confirmation</h2>
          <p>Thank you for your purchase! Your order for <strong>${listing.title}</strong> has been placed successfully.</p>
          <p><strong>Invoice Number:</strong> ${order.invoiceNumber}</p>
          <p><strong>Amount Paid:</strong> ₹${order.amount.toLocaleString()}</p>
          <p>The funds are currently held in a secure escrow and will be released to the seller once you confirm delivery.</p>
          <p>You can download your invoice from the "My Purchases" tab in your dashboard.</p>
        </div>
      `
    });

    // Send Email to Seller
    await transporter.sendMail({
      from: `"RentHub Marketplace" <${process.env.EMAIL_USER}>`,
      to: sellerEmail,
      subject: `New Sale: ${listing.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #000;">New Order Received!</h2>
          <p>Congratulations! You have a new order for <strong>${listing.title}</strong>.</p>
          <p><strong>Invoice Number:</strong> ${order.invoiceNumber}</p>
          <p><strong>Net Earnings:</strong> ₹${order.amount.toLocaleString()}</p>
          <p>Please prepare the item for shipping or delivery. Once the buyer confirms receipt, the funds will be released to your balance.</p>
          <p>View details in your Seller Dashboard.</p>
        </div>
      `
    });

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

app.patch('/api/orders/:id/delivered', verifyToken, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'released' }, { new: true });
    const listing = await Listing.findById(order.listingId);
    await ActivityLog.create({ actionType: 'rental', message: 'Delivery Confirmed', details: `Buyer confirmed delivery for "${listing.title}". Funds released to seller.` });
    await Notification.create({ userId: order.sellerId, type: 'order_delivered', message: `Buyer confirmed delivery! Funds released.` });
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

app.get('/api/orders/seller/:id', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.params.id }).populate('listingId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/orders/buyer/:id', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.params.id }).populate('listingId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payouts/request/:userId', verifyToken, async (req, res) => {
  try {
    const orders = await Order.updateMany(
      { sellerId: req.params.userId, status: 'released' },
      { status: 'payout_requested' }
    );
    if (orders.modifiedCount > 0) {
      await Notification.create({ userId: req.params.userId, type: 'payout_requested', message: `You have successfully requested a payout for ${orders.modifiedCount} order(s).` });
      await ActivityLog.create({ actionType: 'payout', message: 'Payout Requested', details: `Seller ${req.user.fullName} requested payout.` });
    }
    res.json({ success: true, count: orders.modifiedCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin
app.get('/api/admin/stats', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
  try {
    const activeListings = await Listing.countDocuments({ status: 'approved' });
    const pendingApprovals = await Listing.countDocuments({ status: 'pending' });
    const totalOrders = await Order.countDocuments();
    const activeRents = await Order.countDocuments({ status: { $in: ['escrow', 'shipped'] } });
    const totalEarnings = (await Order.find({ status: { $in: ['released', 'paid'] } })).reduce((s, o) => s + (o.amount || 0), 0);
    const totalEscrowVolume = (await Order.find({ status: 'escrow' })).reduce((s, o) => s + (o.amount || 0), 0);
    
    res.json({ 
      activeListings: activeListings || 0, 
      pendingApprovals: pendingApprovals || 0, 
      totalOrders: totalOrders || 0, 
      totalEarnings: totalEarnings || 0, 
      activeRents: activeRents || 0, 
      totalEscrowVolume: totalEscrowVolume || 0 
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/pending', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
  try {
    const pending = await Listing.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/listings', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
  try {
    const listings = await Listing.find({}).sort({ createdAt: -1 });
    res.json(listings);
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

app.get('/api/admin/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/payouts', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
  try {
    const payouts = await Order.find({ status: { $in: ['released', 'payout_requested', 'paid'] } })
      .populate('listingId')
      .sort({ updatedAt: -1 });
    res.json(payouts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/activity', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
  try {
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/payouts/disburse/:sellerId', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access Denied');
  try {
    const orders = await Order.updateMany(
      { sellerId: req.params.sellerId, status: 'payout_requested' },
      { status: 'paid' }
    );
    await ActivityLog.create({ actionType: 'system', message: 'Payout Disbursed', details: `Payouts released for seller ID: ${req.params.sellerId}` });
    res.json({ message: 'Payouts disbursed successfully', count: orders.modifiedCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Chat

app.post('/api/chat/sessions', verifyToken, async (req, res) => {
  try {
    const { sellerId, listingId } = req.body;
    let session = await ChatSession.findOne({ participants: { $all: [req.user._id, sellerId] }, listingId });
    if (!session) { session = new ChatSession({ participants: [req.user._id, sellerId], listingId }); await session.save(); }
    res.json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/chat/sessions/user/:id', verifyToken, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ participants: req.params.id }).sort({ updatedAt: -1 });
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
    const message = new ChatMessage({ ...req.body, senderId: req.user._id });
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
    
    // Fetch live marketplace context to make AI smarter
    const listingCount = await Listing.countDocuments({ status: 'approved' });
    const categories = await Listing.distinct('category');
    
    const systemInstruction = `You are the Official RentHub AI Assistant.
RentHub is a premium peer-to-peer marketplace for renting and buying high-value assets.

CURRENT MARKETPLACE CONTEXT:
- Total Active Listings: ${listingCount}
- Popular Categories: ${categories.join(', ')}

CORE POLICIES:
1. SECURITY: We use a secure Escrow system. Payments are held until the buyer confirms delivery.
2. FEES: Sellers pay 5% commission on Sales and 15% on Rentals. Buyers pay a 5% service fee.
3. INVOICES: Professional invoices are generated for every transaction and can be downloaded as PDFs.
4. TRUST: All sellers are verified, and reviews are mandatory for transparency.

GUIDELINES:
- Be professional, helpful, and concise.
- If asked about "how it works", explain the Escrow and Invoice system.
- Always encourage users to check reviews before renting.
- Never share user private data.`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction 
    });

    const result = await model.generateContent(message);
    res.json({ text: result.response.text() });
  } catch (err) { 
    console.error('AI Error:', err);
    res.status(500).json({ error: 'AI Assistant is temporarily unavailable.' }); 
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Server Start
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB error:', err));
});
