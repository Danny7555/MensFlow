import { Schema, model, Document } from 'mongoose';

export interface WellnessTipDocument extends Document {
  category: 'nutrition' | 'movement' | 'rest' | 'mind';
  title: string;
  summary: string;
  phaseTag: string;
  createdAt: Date;
  updatedAt: Date;
}

const WellnessTipSchema = new Schema<WellnessTipDocument>(
  {
    category: { type: String, enum: ['nutrition', 'movement', 'rest', 'mind'], required: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    phaseTag: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const WellnessTip = model<WellnessTipDocument>('WellnessTip', WellnessTipSchema);
