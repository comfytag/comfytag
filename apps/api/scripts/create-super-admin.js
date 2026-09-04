// Creates or promotes a super-admin account.
//
// Phase 12B — this script previously hardcoded a real email and password
// directly in source (admin@comfytag.com / a literal password), committed
// to version control. Anyone with read access to the repository therefore
// had a working super-admin credential. That literal is gone; credentials
// must now be supplied via environment variables (never committed) or typed
// interactively so nothing sensitive ever touches disk or shell history.
//
// SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD are read only from the process
// environment (e.g. a local, gitignored .env, or injected by the deployment
// platform's secret manager) — never given a fallback value here.
//
// IMPORTANT: if this script was ever run against a real deployment with the
// old hardcoded credential, that admin account's password must be rotated
// immediately — assume the credential was used, do not assume otherwise.
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import User from '../models/User.js';

async function promptHidden(rl, question) {
  // Node's readline has no built-in hidden-input mode; muting stdout while
  // the user types is the standard workaround for a bare readline prompt.
  return new Promise((resolve) => {
    const onWritable = stdout.write.bind(stdout);
    let muted = false;
    stdout.write = (chunk, ...args) => {
      if (muted) return true;
      return onWritable(chunk, ...args);
    };
    rl.question(question, (answer) => {
      stdout.write = onWritable;
      stdout.write('\n');
      resolve(answer);
    });
    muted = true;
  });
}

async function resolveCredentials() {
  const envEmail = process.env.SUPER_ADMIN_EMAIL;
  const envPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (envEmail && envPassword) {
    return { email: envEmail, password: envPassword };
  }

  if (!stdin.isTTY) {
    throw new Error(
      'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must both be set in the environment ' +
      '(non-interactive session — cannot prompt).'
    );
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const email = envEmail || (await rl.question('Super admin email: ')).trim();
    const password = envPassword || (await promptHidden(rl, 'Super admin password: ')).trim();
    return { email, password };
  } finally {
    rl.close();
  }
}

const { email, password } = await resolveCredentials();

if (!email || !password) {
  console.error('\nAborted: both an email and a password are required.\n');
  process.exit(1);
}
if (password.length < 12) {
  console.error('\nAborted: password must be at least 12 characters.\n');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO);

const hashed = await bcrypt.hash(password, 10);

const user = await User.findOneAndUpdate(
  { email: email.toLowerCase() },
  {
    $set: {
      username:  'superadmin',
      name:      'Super Admin',
      email:     email.toLowerCase(),
      password:  hashed,
      isAdmin:   true,
      isPartner: false,
      role:      'super_admin',
      isVerify:  { email: true, photo: false, idCard: false, address: false },
    },
  },
  { upsert: true, new: true, setDefaultsOnInsert: true }
).select('email role isAdmin');

// Never print the password — only confirm the account state.
console.log('\nDone:', user.email, '| role:', user.role, '| isAdmin:', user.isAdmin, '\n');

await mongoose.disconnect();
