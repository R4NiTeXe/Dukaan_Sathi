import mongoose from 'mongoose';
import dns from 'node:dns';
import { DB_NAME } from '../constant.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: DB_NAME,
    });
    console.log(
      `MongoDB connected: ${connectionInstance.connection.host}/${DB_NAME}`
    );
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

export default connectDB;
