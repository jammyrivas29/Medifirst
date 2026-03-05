const mongoose = require('mongoose');
const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medifirst';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('📋 API Endpoints:');
      console.log(`   POST   http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET    http://localhost:${PORT}/api/auth/me`);
      console.log(`   POST   http://localhost:${PORT}/api/auth/logout`);
      console.log(`   POST   http://localhost:${PORT}/api/auth/forgot-password`);
      console.log(`   GET    http://localhost:${PORT}/api/auth/reset-password/:token  ← opens in browser`);
      console.log(`   POST   http://localhost:${PORT}/api/auth/reset-password/:token  ← form submits here`);
      console.log(`   GET    http://localhost:${PORT}/api/first-aid`);
      console.log(`   GET    http://localhost:${PORT}/api/user/profile`);
      console.log('');
      console.log('🎉 MediFirst API is ready!');
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Check your MONGODB_URI in .env file');
    process.exit(1);
  });

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});