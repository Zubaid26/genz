const mongoose = require('mongoose');

// Reuse one connection across serverless invocations; reconnect if it dropped.
let connecting = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connecting) {
    mongoose.set('bufferCommands', false);
    connecting = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .then((conn) => {
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn.connection;
      })
      .catch((error) => {
        connecting = null; // allow a retry on the next request
        console.error(`MongoDB Connection Error: ${error.message}`);
        throw error;
      });
  }
  return connecting;
};

module.exports = connectDB;
