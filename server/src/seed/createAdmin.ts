/**
 * Admin bootstrap. Admin accounts can never be created through public registration.
 *
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='a-strong-passw0rd' ADMIN_NAME='Site Admin' npm run create-admin
 *
 * Creates the admin if the email is new, or promotes an existing account to admin (password is
 * only set for new accounts unless ADMIN_RESET_PASSWORD=true).
 */
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';

/* eslint-disable no-console */

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'SchemeSetu Admin';
  const resetPassword = process.env.ADMIN_RESET_PASSWORD === 'true';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set ADMIN_EMAIL to a valid email address.');
  if (!password || password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Set ADMIN_PASSWORD to at least 12 characters including letters and numbers.');
  }

  await connectDatabase();
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    if (resetPassword) {
      existing.passwordHash = await bcrypt.hash(password, 12);
      existing.set('tokenVersion', ((existing.get('tokenVersion') as number) ?? 0) + 1);
    }
    await existing.save();
    console.log(`Promoted existing account to admin: ${email}${resetPassword ? ' (password reset)' : ''}`);
  } else {
    await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: 'admin', onboardingCompletedAt: new Date() });
    console.log(`Created admin account: ${email}`);
  }
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error('create-admin failed:', err.message);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
