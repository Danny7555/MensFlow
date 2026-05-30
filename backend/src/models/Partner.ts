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
  pingId: { type: String, required: true, maxlength: 80 },
  label: { type: String, required: true, maxlength: 80 },
  message: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Number, required: true },
});

PartnerPingSchema.index({ receiverId: 1, timestamp: -1 });

export const PartnerPing = model<PartnerPingDocument>('PartnerPing', PartnerPingSchema);

// ─────────────────────────────────────────────────────────────────────────────

export interface SupportActionDocument extends Document {
  userId: Schema.Types.ObjectId;
  actionId: string;
  completedAt: string;       // YYYY-MM-DD
}

const SupportActionSchema = new Schema<SupportActionDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actionId: { type: String, required: true, maxlength: 120 },
  completedAt: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
});

SupportActionSchema.index({ userId: 1, actionId: 1, completedAt: 1 }, { unique: true });

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
