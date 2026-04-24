import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', orderSchema);

async function inspect() {
  try {
    await mongoose.connect(MONGODB_URI);
    const count = await Order.countDocuments({});
    console.log(`Total Orders in DB: ${count}`);
    if (count > 0) {
        const orders = await Order.find({}).limit(10);
        orders.forEach(o => console.log(`Order ID: ${o._id}, Buyer: ${o.buyerId}, Seller: ${o.sellerId}`));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
