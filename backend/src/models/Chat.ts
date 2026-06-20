import { Schema, model, Document } from 'mongoose';
import { ChatRole } from '../interfaces';

export interface ChatMessageDocument extends Document {
  userId: Schema.Types.ObjectId;
  sessionId: string;
  role: ChatRole;
  text: string;
  isLocked: boolean;
  passcode: string | null;
  passcodeEncrypted: string | null;
  securityQuestion: string | null;
  securityAnswerHash: string | null;
  createdAt: number;
}

const ChatMessageSchema = new Schema<ChatMessageDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, maxlength: 120 },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true, maxlength: 8000 },
  isLocked: { type: Boolean, default: false },
  passcode: { type: String, default: null, maxlength: 80 },
  passcodeEncrypted: { type: String, default: null },
  securityQuestion: { type: String, default: null, maxlength: 200 },
  securityAnswerHash: { type: String, default: null },
  createdAt: { type: Number, required: true },
});

ChatMessageSchema.index({ userId: 1, sessionId: 1 });
ChatMessageSchema.index({ userId: 1, sessionId: 1, createdAt: 1 });

export const ChatMessage = model<ChatMessageDocument>('ChatMessage', ChatMessageSchema);
