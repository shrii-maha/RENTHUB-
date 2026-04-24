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

// Models
import Listing from './models/Listing.js';
import ActivityLog from './models/ActivityLog.js';
import Order from './models/Order.js';
import User from './models/User.js';
import Review from './models/Review.js';
import ChatSession from './models/ChatSession.js';
import ChatMessage from './models/ChatMessage.js';
import Notification from './models/Notification.js';

// Auth Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

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
        user = new User({
          fullName: profile.displayName || 'Google User',
          email,
          avatar: profile.photos?.[0]?.value || '',
        });
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
        user = new User({
          fullName: profile.displayName || profile.username || 'GitHub User',
          email,
          avatar: profile.photos?.[0]?.value || '',
        });
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

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'renthub', allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] }
});
const upload = multer({ storage });

// Database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/renthub')
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB error:', err));

// --- API ROUTES ---

// Geocoding Helper
const getCoordinates = async (location) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`);
    const data = await res.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (err) { console.error('Geocoding failed:', err); }
  return null;
};

app.post('/api/listings', verifyToken, async (req, res) => {
  try {
    const listingData = { ...req.body, status: 'pending', sellerId: req.user.email };
    
    // Auto Geocode
    const coords = await getCoordinates(req.body.location);
    if (coords) {
      listingData.lat = coords.lat;
      listingData.lng = coords.lng;
    }

    const listing = new Listing(listingData);
    await listing.save();
    
    await ActivityLog.create({
      actionType: 'system',
      message: 'New Product Listed',
      details: `${listing.title} is pending approval`
    });

    res.status(201).json(listing);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/listings', async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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

// Admin endpoints
app.patch('/api/admin/listings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (status === 'approved') {
      await Notification.create({
        userId: listing.sellerId,
        type: 'listing_approved',
        message: `Your listing "${listing.title}" has been approved!`
      });
    }
    res.json(listing);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Server Start
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
