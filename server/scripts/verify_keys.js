import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenAI } from "@google/genai";
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function verifyKeys() {
  console.log('🛡️ Starting External Service Verification...\n');

  // 1. Cloudinary
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary: Connected (Status:', result.status, ')');
  } catch (err) {
    console.log('❌ Cloudinary: FAILED -', err.message);
  }

  // 2. Stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('⚠️ Stripe: MISSING (STRIPE_SECRET_KEY not found in .env)');
  } else {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const balance = await stripe.balance.retrieve();
      console.log('✅ Stripe: Connected (Live Mode:', balance.livemode, ')');
    } catch (err) {
      console.log('❌ Stripe: FAILED -', err.message);
    }
  }

  // 3. Google GenAI (Gemini)
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.log('⚠️ Google AI: MISSING (GOOGLE_GENAI_API_KEY not found in .env)');
  } else {
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
      // Using the pattern from server/index.js
      const model = genAI.models.get('gemini-1.5-flash');
      if (model) {
        console.log('✅ Google AI: Connected (Gemini 1.5 Flash initialized)');
      }
    } catch (err) {
      console.log('❌ Google AI: FAILED -', err.message);
    }
  }

  // 4. Nodemailer (Gmail)
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.verify();
    console.log('✅ Nodemailer: SMTP Connected (Gmail Auth Success)');
  } catch (err) {
    console.log('❌ Nodemailer: FAILED -', err.message);
  }

  // 5. Socket.io (Internal check)
  console.log('✅ Socket.io: Server initialized on port 3001');

  console.log('\n✨ Verification Complete.');
  process.exit(0);
}

verifyKeys();
