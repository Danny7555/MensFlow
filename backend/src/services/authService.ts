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

export async function generateUniquePartnerCode(): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const exists = await User.exists({ partnerCode: code });
    if (!exists) return code;
  }
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

  const partnerCode = await generateUniquePartnerCode();
  const passwordHash = await bcrypt.hash(password, 10);

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

  // Check if OTP is enabled for this user via their Settings doc
  const settings = await Settings.findOne({ userId: user._id }).lean();
  const otpEnabled = settings?.otpEnabled ?? user.otpEnabled ?? true;

  if (otpEnabled) {
    const otpToken = await createOtpSession(String(user._id));
    return { requiresOtp: true, otpToken, user: userToResponse(user) };
  }

  // OTP disabled — issue JWT immediately
  const token = signToken(String(user._id), user.username);
  return { token, user: userToResponse(user) };
}

function signToken(id: string, username: string): string {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  return jwt.sign({ id, username }, secret, { expiresIn } as jwt.SignOptions);
}
