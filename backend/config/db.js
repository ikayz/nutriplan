const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutriplan',
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.warn(
      'Continuing without MongoDB connection. Some features will be limited.',
    );
    // Do not exit process here; allow the server to start so endpoints that
    // don't require the database (mock fallbacks) remain available for testing.
  }
};

module.exports = connectDB;
