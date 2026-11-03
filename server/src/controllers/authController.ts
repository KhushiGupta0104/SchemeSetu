import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, toPublicUser, type UserDoc } from '../models/User.js';
import { SavedScheme } from '../models/SavedScheme.js';
import { Application } from '../models/Application.js';
import { ChecklistProgress } from '../models/ChecklistProgress.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/http.js';
import {
  CSRF_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  ensureCsrfToken,
  setAuthCookies,
  verifyRefreshToken,
} from '../services/authTokens.js';

const BCRYPT_ROUNDS = 12;
// Used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-password', BCRYPT_ROUNDS);

function issueSession(res: Response, user: UserDoc & { tokenVersion?: number }) {
  setAuthCookies(res, { id: String(user._id), role: user.role, tokenVersion: user.tokenVersion ?? 0 });
}

export async function csrf(req: Request, res: Response) {
  const token = ensureCsrfToken(req.cookies?.[CSRF_COOKIE], res);
  return ok(res, { csrfToken: token });
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists. Try logging in instead.');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  // Role is never taken from the request: every self-registered account is a normal user.
  const user = await User.create({ name, email, passwordHash, role: 'user' });
  issueSession(res, user);
  return ok(res, { user: toPublicUser(user) }, 201);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email }).select('+passwordHash +tokenVersion');
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw ApiError.unauthenticated('Incorrect email or password.');
  issueSession(res, user);
  return ok(res, { user: toPublicUser(user) });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    clearAuthCookies(res);
    throw ApiError.unauthenticated('Your session has ended. Please log in again.');
  }
  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub).select('+tokenVersion');
    if (!user || (user.tokenVersion ?? 0) !== payload.v) throw new Error('revoked');
    issueSession(res, user); // rotates both tokens
    return ok(res, { user: toPublicUser(user) });
  } catch {
    clearAuthCookies(res);
    throw ApiError.unauthenticated('Your session has ended. Please log in again.');
  }
}

export async function logout(req: Request, res: Response) {
  // Revoke outstanding refresh tokens for this account, then clear cookies.
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.updateOne({ _id: payload.sub, tokenVersion: payload.v }, { $inc: { tokenVersion: 1 } });
    } catch {
      /* already invalid — nothing to revoke */
    }
  }
  clearAuthCookies(res);
  return ok(res, { loggedOut: true });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.unauthenticated();
  return ok(res, { user: toPublicUser(user) });
}

/** Deletes the account and all associated personal data (saved, applications, checklists). */
export async function deleteAccount(req: Request, res: Response) {
  const user = await User.findById(req.user!.id).select('+passwordHash');
  if (!user) throw ApiError.unauthenticated();
  if (!(await bcrypt.compare((req.body as { password: string }).password, user.passwordHash))) {
    throw ApiError.badRequest('Password is incorrect.');
  }
  if (user.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1) {
    throw ApiError.conflict('You are the only administrator. Create another admin before deleting this account.');
  }
  const userId = new mongoose.Types.ObjectId(String(user._id));
  await Promise.all([
    SavedScheme.deleteMany({ userId }),
    Application.deleteMany({ userId }),
    ChecklistProgress.deleteMany({ userId }),
  ]);
  await user.deleteOne();
  clearAuthCookies(res);
  return ok(res, { deleted: true });
}
