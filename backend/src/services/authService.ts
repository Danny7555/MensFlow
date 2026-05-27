import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Settings } from '../models/Settings';
import { Dashboard } from '../models/Dashboard';
import { SupportStreak } from '../models/Partner';
import { IUser } from '../interfaces';

export async function generateUniquePartnerCode(): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const exists = await User.exists({ partnerCode: code });
    if (!exists) return code;
  }
  throw new Error('Unable to generate a unique partner code — please try again');
}

export async function registerUser(
  username: string,
  password: string,
  name: string
): Promise<{ token: string; user: Partial<IUser> }> {
  const existingUser = await User.findOne({ username: username.toLowerCase() });
  if (existingUser) {
    throw Object.assign(new Error('Username is already taken'), { status: 400 });
  }

  const partnerCode = await generateUniquePartnerCode();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({ username, passwordHash, name, partnerCode });

  const defaultLastPeriodStart = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  await Settings.create({ userId: user._id });
  await Dashboard.create({ userId: user._id, lastPeriodStart: defaultLastPeriodStart });
  await SupportStreak.create({ userId: user._id });

  const token = signToken(String(user._id), user.username);

  return {
    token,
    user: {
      id: String(user._id),
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      accessLevel: user.accessLevel,
      partnerCode: user.partnerCode,
      partnerId: null,
    },
  };
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ token: string; user: Partial<IUser> }> {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { status: 400 });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid credentials'), { status: 400 });
  }

  const token = signToken(String(user._id), user.username);

  return {
    token,
    user: {
      id: String(user._id),
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      accessLevel: user.accessLevel,
      partnerCode: user.partnerCode,
      partnerId: user.partnerId ? String(user.partnerId) : null,
    },
  };
}

function signToken(id: string, username: string): string {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  return jwt.sign({ id, username }, secret, { expiresIn } as jwt.SignOptions);
}
