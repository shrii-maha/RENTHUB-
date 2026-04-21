import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env from current working directory (root)
dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("No MONGODB_URI found in .env");
  process.exit(1);
}

async function dropIndex() {
  try {
    await mongoose.connect(uri as string);
    console.log("Connected to MongoDB");
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("No database connection");
    }

    try {
      await db.collection('users').dropIndex('clerkId_1');
      console.log("Successfully dropped index 'clerkId_1' from 'users' collection.");
    } catch (e: any) {
      console.log("Error or index doesn't exist:", e.message);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

dropIndex();
