require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

const check = async () => {
  await connectDB();
  const users = await mongoose.connection.db
    .collection('users')
    .find({}, { projection: { email: 1, password: 1, isActive: 1 } })
    .toArray();
  
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
};

check();