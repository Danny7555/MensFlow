import { Schema, model } from 'mongoose';

export type AIFeature = 'chat' | 'guest-chat' | 'suggestions' | 'daily-guidance' | 'extraction' | 'partner-empathy';

export interface IAILog {
  feature: AIFeature;
  userId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

const AILogSchema = new Schema<IAILog>({
  feature: { type: String, required: true, enum: ['chat', 'guest-chat', 'suggestions', 'daily-guidance', 'extraction', 'partner-empathy'] },
  userId: { type: String, default: null },
  model: { type: String, default: 'llama-3.3-70b-versatile' },
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  success: { type: Boolean, required: true },
  error: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
});

AILogSchema.index({ feature: 1, timestamp: -1 });
AILogSchema.index({ userId: 1, timestamp: -1 });
AILogSchema.index({ success: 1 });

export const AILog = model<IAILog>('AILog', AILogSchema);

export async function logAIInteraction(params: {
  feature: AIFeature;
  userId?: string;
  model: string;
  success: boolean;
  error?: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}): Promise<void> {
  const entry = {
    ...params,
    timestamp: new Date(),
  };

  console.log(JSON.stringify({ type: 'ai_log', ...entry }));

  try {
    await AILog.create(entry);
  } catch {
    // Fire-and-forget — don't let logging failures affect the app
  }
}
