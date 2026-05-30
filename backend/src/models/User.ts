import { Schema, model, Document } from 'mongoose';

export interface UserDocument extends Document {
  username: string;
  passwordHash: string;
  name: string;
  avatar: string | null;
  accessLevel: 'full' | 'educational';
  isOnboarded: boolean;
  partnerCode: string;
  partnerId: Schema.Types.ObjectId | null;
  role: 'lady' | 'partner';
  createdAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 120 },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    avatar: { type: String, default: null, maxlength: 500 },
    accessLevel: { type: String, enum: ['full', 'educational'], default: 'full' },
    isOnboarded: { type: Boolean, default: false },
    partnerCode: { type: String, required: true, unique: true, uppercase: true },
    partnerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    role: { type: String, enum: ['lady', 'partner'], default: 'lady' },
  },
  { timestamps: true }
);

export const User = model<UserDocument>('User', UserSchema);
