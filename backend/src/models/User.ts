import { Schema, model, Document } from 'mongoose';

export interface UserDocument extends Document {
  username: string;
  passwordHash: string;
  name: string;
  avatar: string | null;
  accessLevel: 'full' | 'educational';
  partnerCode: string;
  partnerId: Schema.Types.ObjectId | null;
  createdAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: null },
    accessLevel: { type: String, enum: ['full', 'educational'], default: 'full' },
    partnerCode: { type: String, required: true, unique: true, uppercase: true },
    partnerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const User = model<UserDocument>('User', UserSchema);
