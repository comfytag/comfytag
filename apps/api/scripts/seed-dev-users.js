import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const users = [
  {
    username: 'testpartner',
    name: 'Test Partner',
    email: 'partner@comfytag.dev',
    password: 'TestPass123!',
    isPartner: true,
    isAdmin: false,
    isVerify: { email: true, photo: false, idCard: false, address: false },
  },
  {
    username: 'testadmin',
    name: 'Test Admin',
    email: 'admin@comfytag.dev',
    password: 'Admin123!',
    isPartner: false,
    isAdmin: true,
    role: 'super_admin',
    isVerify: { email: true, photo: false, idCard: false, address: false },
  },
];

await mongoose.connect(process.env.MONGO);

for (const u of users) {
  const hashedPassword = await bcrypt.hash(u.password, 10);
  await User.findOneAndUpdate(
    { email: u.email },
    { ...u, password: hashedPassword },
    { upsert: true, new: true }
  );
}

await mongoose.disconnect();

console.log('\nDev seed complete. Test credentials:\n');
console.log('  Partner  email=partner@comfytag.dev  password=TestPass123!');
console.log('  Admin    email=admin@comfytag.dev    password=Admin123!\n');
