import { Schema, model, Document } from 'mongoose';

export interface SymptomLogDocument extends Document {
  userId: Schema.Types.ObjectId;
  date: string;
  symptoms: string[];
}

const SymptomLogSchema = new Schema<SymptomLogDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  symptoms: { type: [String], default: [] },
});

SymptomLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const SymptomLog = model<SymptomLogDocument>('SymptomLog', SymptomLogSchema);

// ─────────────────────────────────────────────────────────────────────────────

export interface CustomSymptomDocument extends Document {
  userId: Schema.Types.ObjectId;
  label: string;
  category: string;
}

const CustomSymptomSchema = new Schema<CustomSymptomDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
});

export const CustomSymptom = model<CustomSymptomDocument>('CustomSymptom', CustomSymptomSchema);
