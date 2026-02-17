require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
const connectDB = require('../src/config/db');

const fix = async () => {
  await connectDB();

  // امسح كل الـ users
  await mongoose.connection.db.collection('users').deleteMany({});
  console.log('🗑️  Deleted all users');

  // عمل واحد جديد صح من خلال الـ model
  const user = await User.create({
    name: 'Super Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@masterstack.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
    role: 'super_admin',
    isActive: true,
  });

  console.log('✅ Admin created, password hashed:', user.password.startsWith('$2b$'));
  process.exit(0);
};

fix();