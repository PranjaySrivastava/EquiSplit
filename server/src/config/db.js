const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // 1. Try to connect to configured URI if present
  if (uri && uri !== 'mongodb://localhost:27017/equisplit') {
    try {
      console.log(`Connecting to configured MongoDB URI...`);
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      console.log(`MongoDB Connected (Remote/Custom): ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`Could not connect to configured MongoDB URI: ${err.message}`);
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.log(`Falling back to local / in-memory MongoDB...`);
    }
  }

  // 2. Try default local MongoDB
  try {
    const conn = await mongoose.connect(uri || 'mongodb://127.0.0.1:27017/equisplit', {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected (Local Daemon): ${conn.connection.host}`);
    return conn;
  } catch (localErr) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Production MongoDB connection error: Please verify your MONGODB_URI in Render environment variables. ${localErr.message}`);
    }

    // 3. Fallback to MongoMemoryServer so application runs seamlessly out-of-the-box locally!
    try {
      console.log(`No local MongoDB daemon running. Starting fast in-memory MongoDB instance for local evaluation...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongodInstance.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`In-Memory MongoDB Started and Connected! URI: ${inMemoryUri}`);
      return conn;
    } catch (memErr) {
      console.error(`Failed to start in-memory MongoDB fallback: ${memErr.message}`);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
