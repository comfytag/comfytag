import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

await mongoose.connect(process.env.MONGO);

const email = 'admin@comfytag.com';
const password = 'Motorcard12@';
const hashed = await bcrypt.hash(password, 10);

const user = await User.findOneAndUpdate(
  { email },
  {
    $set: {
      username:  'superadmin',
      name:      'Super Admin',
      email,
      password:  hashed,
      isAdmin:   true,
      isPartner: false,
      role:      'super_admin',
      isVerify:  { email: true, photo: false, idCard: false, address: false },
    },
  },
  { upsert: true, new: true, setDefaultsOnInsert: true }
).select('email role isAdmin');

console.log('\nDone:', user.email, '| role:', user.role, '| isAdmin:', user.isAdmin, '\n');

await mongoose.disconnect();
