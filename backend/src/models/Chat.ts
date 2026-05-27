import { Schema, model, Document } from 'mongoose';
import { ChatRole } from '../interfaces';

export interface ChatMessageDocument extends Document {
  userId: Schema.Types.ObjectId;
  sessionId: string;
  role: ChatRole;
  text: string;
  isLocked: boolean;
  passcode: string | null;
  securityQuestion: string | null;
  securityAnswerHash: string | null;
  createdAt: number;
}

const ChatMessageSchema = new Schema<ChatMessageDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
  isLocked: { type: Boolean, default: false },
  passcode: { type: String, default: null },
  securityQuestion: { type: String, default: null },
  securityAnswerHash: { type: String, default: null },
  createdAt: { type: Number, required: true },
});

ChatMessageSchema.index({ userId: 1, sessionId: 1 });

export const ChatMessage = model<ChatMessageDocument>('ChatMessage', ChatMessageSchema);
