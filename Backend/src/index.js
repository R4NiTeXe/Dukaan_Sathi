import 'dotenv/config';
import app from './app.js';
import mongoose from 'mongoose';
import connectDB from './db/index.js';
import config from './config/index.js';

config.validateEnv();

let server;

const startServer = async () => {
  await connectDB();
  server = app.listen(config.server.port, () => {
    console.log(`Server is running at port : ${config.server.port}`);
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      console.log('HTTP server closed');
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  } catch (err) {
    console.warn('Error during shutdown:', err.message);
  }
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

try {
  startServer();
} catch (err) {
  console.error('Failed to start server:', err.message);
  process.exit(1);
}