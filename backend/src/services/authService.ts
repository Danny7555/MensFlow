import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Settings } from '../models/Settings';
import { Dashboard } from '../models/Dashboard';
import { SupportStreak } from '../models/Partner';
import { IUser, AuthResponse } from '../interfaces';
import { getJwtSecret } from '../config/env';
import { httpError } from '../utils/http';
import { createOtpSession } from './otpService';
import { getUserProfile } from './userService';

export async function generateUniquePartnerCode(): Promise<string> {
  const allCodes = Array.from({ length: 100 }, () => crypto.randomBytes(3).toString('hex').toUpperCase());
  const used = await User.find({ partnerCode: { $in: allCodes } }, { partnerCode: 1 }).lean();
  const usedSet = new Set(used.map(u => u.partnerCode));
  const available = allCodes.find(c => !usedSet.has(c));
  if (available) return available;
  throw new Error('Unable to generate a unique partner code — please try again');
}

function userToResponse(user: InstanceType<typeof User>): Partial<IUser> {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    accessLevel: user.accessLevel,
    isOnboarded: user.isOnboarded,
    partnerCode: user.partnerCode,
    partnerId: user.partnerId ? String(user.partnerId) : null,
    role: user.role,
    onboardingData: (user.onboardingData as Record<string, unknown>) || {},
    xp: user.xp || 0,
    quizLastCompletedAt: user.quizLastCompletedAt || '',
    quizCountToday: user.quizCountToday || 0,
  };
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
  name: string,
  role: 'lady' | 'partner' = 'lady'
): Promise<AuthResponse> {
  const normalizedUsername = username.toLowerCase();
  const normalizedEmail = email.toLowerCase();

  const [existingUsername, existingEmail] = await Promise.all([
    User.findOne({ username: normalizedUsername }),
    User.findOne({ email: normalizedEmail }),
  ]);

  if (existingUsername) throw httpError('Username is already taken', 409);
  if (existingEmail) throw httpError('An account with that email already exists', 409);

  const [partnerCode, passwordHash] = await Promise.all([
    generateUniquePartnerCode(),
    bcrypt.hash(password, 10),
  ]);

  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    name,
    partnerCode,
    role,
  });

  await Settings.create({ userId: user._id });
  await Dashboard.create({ userId: user._id, lastPeriodStart: '' });
  await SupportStreak.create({ userId: user._id });

  // Always send OTP on registration (user can disable later in settings)
  const otpToken = await createOtpSession(String(user._id));

  return { requiresOtp: true, otpToken, user: userToResponse(user) };
}

export async function loginUser(
  usernameOrEmail: string,
  password: string
): Promise<AuthResponse> {
  const normalized = usernameOrEmail.toLowerCase();

  // Allow login by either username OR email
  const user = await User.findOne({
    $or: [{ username: normalized }, { email: normalized }],
  });

  if (!user) throw httpError('Invalid credentials', 400);

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw httpError('Invalid credentials', 400);

  if (user.isDeactivated) {
    user.isDeactivated = false;
    await user.save();
  }

  // Check if OTP is enabled for this user via their Settings doc
  const settings = await Settings.findOne({ userId: user._id }).lean();
  const otpEnabled = settings?.otpEnabled ?? user.otpEnabled ?? true;

  if (otpEnabled) {
    const otpToken = await createOtpSession(String(user._id));
    return { requiresOtp: true, otpToken, user: userToResponse(user) };
  }

  // OTP disabled — issue JWT immediately
  const token = signToken(String(user._id), user.username);
  const profileData = await getUserProfile(String(user._id));

  return { 
    token, 
    user: profileData.user,
    settings: profileData.settings,
    dashboard: profileData.dashboard,
  };
}

function signToken(id: string, username: string): string {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  return jwt.sign({ id, username }, secret, { expiresIn } as jwt.SignOptions);
}

// ─── Reset Password ───────────────────────────────────────────────────────────

/**
 * Step 1 — Request a password-reset code.
 * Always returns the same generic message to prevent email enumeration.
 */
export async function forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
  const { createResetSession } = await import('./otpService');
  const resetToken = await createResetSession(email);
  return {
    message: 'If that email address is registered, a reset code has been sent.',
    resetToken: resetToken ?? undefined,
  };
}

/**
 * Step 2 — Verify the 6-digit reset code.
 * Returns a short-lived passwordResetToken if valid.
 */
export async function verifyResetOtp(
  resetToken: string,
  code: string
): Promise<{ passwordResetToken: string }> {
  const { verifyResetToken, signPasswordResetToken } = await import('./otpService');
  const bcrypt = (await import('bcryptjs')).default;

  const { id: userId } = verifyResetToken(resetToken);
  const user = await User.findById(userId);
  if (!user) throw httpError('User not found', 404);

  if (!user.otpHash || !user.otpExpiry) {
    throw httpError('No pending reset found. Please request a new code.', 400);
  }
  if (new Date() > user.otpExpiry) {
    user.otpHash = null;
    user.otpExpiry = null;
    user.otpTempToken = null;
    await user.save();
    throw httpError('Reset code has expired. Please request a new one.', 400);
  }

  const isMatch = await bcrypt.compare(code.trim(), user.otpHash);
  if (!isMatch) throw httpError('Incorrect code. Please check your email and try again.', 400);

  // Clear OTP fields — code is consumed
  user.otpHash = null;
  user.otpExpiry = null;
  user.otpTempToken = null;
  await user.save();

  const passwordResetToken = signPasswordResetToken(String(user._id));
  return { passwordResetToken };
}

/**
 * Step 3 — Set a new password.
 * Requires the short-lived passwordResetToken from step 2.
 */
export async function resetPassword(
  passwordResetToken: string,
  newPassword: string
): Promise<{ message: string }> {
  const { verifyResetToken } = await import('./otpService');
  const bcrypt = (await import('bcryptjs')).default;

  const { id: userId } = verifyResetToken(passwordResetToken);
  const user = await User.findById(userId);
  if (!user) throw httpError('User not found', 404);

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: 'Password updated successfully. You can now sign in with your new password.' };
}

