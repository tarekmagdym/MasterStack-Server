// scripts/seed.js
// Run: node scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User.model');
const connectDB = require('../src/config/db');

const seed = async () => {
  await connectDB();

  try {
    // Check if super admin already exists
    const exists = await User.findOne({ role: 'super_admin' });
    if (exists) {
      console.log('⚠️  Super admin already exists:', exists.email);
      process.exit(0);
    }

    const superAdmin = await User.create({
      name: 'Super Admin',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@masterstack.com',
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
      role: 'super_admin',
      isActive: true,
    });

    console.log('✅ Super admin created successfully!');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: ${process.env.SEED_ADMIN_PASSWORD || 'Admin@123456'}`);
    console.log('   ⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Seed error:', error.message);
  }

  process.exit(0);
};

seed();
