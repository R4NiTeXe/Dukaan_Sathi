import mongoose from 'mongoose';
import dns from 'node:dns';
import config from '../config/index.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(config.db.uri, {
      dbName: config.db.name,
    });
    console.log(
      `MongoDB connected: ${connectionInstance.connection.host}/${config.db.name}`
    );
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

export default connectDB;
