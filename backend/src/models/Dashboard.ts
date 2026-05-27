import { Schema, model, Document } from 'mongoose';

export interface DashboardDocument extends Document {
  userId: Schema.Types.ObjectId;
  lastPeriodStart: string;
  typicalCycleDays: number;
  phaseLabel: string;
  hormoneTrend: string;
  bodySignals: string;
  guidanceLines: string[];
  cycleNotes: string;
}

const DashboardSchema = new Schema<DashboardDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  lastPeriodStart: { type: String, required: true },
  typicalCycleDays: { type: Number, default: 28 },
  phaseLabel: { type: String, default: 'Luteal' },
  hormoneTrend: { type: String, default: 'Progesterone rising' },
  bodySignals: { type: String, default: 'Fatigue, appetite changes' },
  guidanceLines: { type: [String], default: [] },
  cycleNotes: { type: String, default: '' },
});

export const Dashboard = model<DashboardDocument>('Dashboard', DashboardSchema);
