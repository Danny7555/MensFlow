import { Schema, model, Document } from 'mongoose';

export interface PartnerPingDocument extends Document {
  senderId: Schema.Types.ObjectId;
  receiverId: Schema.Types.ObjectId;
  pingId: string;
  label: string;
  message: string;
  timestamp: number;
}

const PartnerPingSchema = new Schema<PartnerPingDocument>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pingId: { type: String, required: true },
  label: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Number, required: true },
});

export const PartnerPing = model<PartnerPingDocument>('PartnerPing', PartnerPingSchema);

// ─────────────────────────────────────────────────────────────────────────────

export interface SupportActionDocument extends Document {
  userId: Schema.Types.ObjectId;
  actionId: string;
  completedAt: string;       // YYYY-MM-DD
}

const SupportActionSchema = new Schema<SupportActionDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actionId: { type: String, required: true },
  completedAt: { type: String, required: true },
});

export const SupportAction = model<SupportActionDocument>('SupportAction', SupportActionSchema);

// ─────────────────────────────────────────────────────────────────────────────

export interface SupportStreakDocument extends Document {
  userId: Schema.Types.ObjectId;
  streak: number;
  lastActionDate: string;
}

const SupportStreakSchema = new Schema<SupportStreakDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  streak: { type: Number, default: 0 },
  lastActionDate: { type: String, default: '' },
});

export const SupportStreak = model<SupportStreakDocument>('SupportStreak', SupportStreakSchema);
