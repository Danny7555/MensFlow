import { Schema, model, Document, Types } from 'mongoose';

export interface MedicationDocument extends Document {
  userId: Types.ObjectId;
  name: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'as-needed';
  timeOfDay: string;
  notes: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MedicationSchema = new Schema<MedicationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, maxlength: 100 },
  dosage: { type: String, default: '' },
  frequency: { type: String, enum: ['daily', 'weekly', 'as-needed'], default: 'daily' },
  timeOfDay: { type: String, default: '08:00' },
  notes: { type: String, default: '', maxlength: 500 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

MedicationSchema.index({ userId: 1, active: 1 });

export const Medication = model<MedicationDocument>('Medication', MedicationSchema);
