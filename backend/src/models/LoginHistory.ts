import { Schema, model, Document } from 'mongoose';

export interface LoginHistoryDocument extends Document {
  userId: Schema.Types.ObjectId;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

const LoginHistorySchema = new Schema<LoginHistoryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ip: { type: String, default: 'Unknown' },
    userAgent: { type: String, default: 'Unknown' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const LoginHistory = model<LoginHistoryDocument>('LoginHistory', LoginHistorySchema);
