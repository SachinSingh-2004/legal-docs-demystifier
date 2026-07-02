const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/legal-docs-demystifier';
    
    // Connect to MongoDB
    const conn = await mongoose.connect(connUri);
    
    console.log(`\n💚 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    // Return mock connection object for testing if offline/no local mongo
    console.log('Running server with local mongo fallback...');
    return null;
  }
};

module.exports = connectDB;
