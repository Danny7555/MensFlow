import { Schema, model, Document } from 'mongoose';

export interface UserDocument extends Document {
  username: string;
  email: string | null;
  passwordHash: string;
  name: string;
  avatar: string | null;
  accessLevel: 'full' | 'educational';
  isOnboarded: boolean;
  partnerCode: string;
  partnerId: Schema.Types.ObjectId | null;
  role: 'lady' | 'partner';
  onboardingData: Record<string, unknown>;
  xp: number;
  quizLastCompletedAt: string;
  quizCountToday: number;
  createdAt: Date;
  // OTP / Two-factor auth
  otpEnabled: boolean;
  otpHash: string | null;
  otpExpiry: Date | null;
  otpTempToken: string | null;
}

const UserSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 120 },
    email: { type: String, required: false, unique: true, sparse: true, trim: true, lowercase: true, maxlength: 254, default: null },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    avatar: { type: String, default: null, maxlength: 500 },
    accessLevel: { type: String, enum: ['full', 'educational'], default: 'full' },
    isOnboarded: { type: Boolean, default: false },
    partnerCode: { type: String, required: true, unique: true, uppercase: true },
    partnerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    role: { type: String, enum: ['lady', 'partner'], default: 'lady' },
    onboardingData: { type: Object, default: {} },
    xp: { type: Number, default: 0 },
    quizLastCompletedAt: { type: String, default: '' },
    quizCountToday: { type: Number, default: 0 },
    // OTP / Two-factor auth
    otpEnabled: { type: Boolean, default: true },
    otpHash: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    otpTempToken: { type: String, default: null },
  },
  { timestamps: true }
);

export const User = model<UserDocument>('User', UserSchema);
